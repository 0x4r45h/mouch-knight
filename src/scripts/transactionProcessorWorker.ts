import {Worker} from 'bullmq';
import {getContractConfig, getPublicClientByChainId, getSignerClientByChainId, HexString} from '@/config';
import { SendUserScoreJobData, TxJobData} from "@/services/queue";
import {privateKeyToAccount} from "viem/accounts";
import {WriteContractErrorType} from "viem";
import prisma from "@/db/client";
import {redis, redisConnection} from "@/db/redis";
import {monadTestnet} from "viem/chains";

// Redis sorted set for round-robin relayer keys
const RELAYER_KEYS_SET = 'relayer_keys';

// Function to get and cache nonce

async function deleteBadNonce(address: HexString, chainId: number) {
    const nonceKey = `${chainId}:${address}:nonce`;
    await redis.del(nonceKey);
}

async function getNonce(address: HexString, chainId: number): Promise<number> {
    const nonceKey = `${chainId}:${address}:nonce`;
    const lockKey = `${nonceKey}:lock`;
    const lockTimeout = 5000; // 5 seconds lock timeout
    const retryDelay = 20; // 10ms between retries
    const maxRetries = 250; // Maximum number of retries (5 seconds total)

    // If nonce not in Redis, we need to acquire a lock before querying blockchain
    let retries = 0;
    while (retries < maxRetries) {
        // Try to acquire the lock with expiration
        const acquired = await redis.set(lockKey, '1', 'PX', lockTimeout, 'NX');

        if (acquired) {
            console.log(` Acquired lock: ${acquired}`);
            try {
                // Check once more if another process set the nonce while we were waiting
                const redisNonce = await redis.get(nonceKey);
                if (redisNonce !== null) {
                    console.log(`Nonce ${nonceKey} found in Redis: ${redisNonce}`);

                    const currentNonce = parseInt(redisNonce, 10);
                    await redis.set(nonceKey, (currentNonce + 1).toString(), 'EX', 10);
                    return currentNonce;
                }

                // Fetch nonce from blockchain
                const publicClient = getPublicClientByChainId(chainId);
                const currentNonce = await publicClient.getTransactionCount({address});

                // Store the incremented nonce in Redis
                await redis.set(nonceKey, (currentNonce + 1).toString(), 'EX', 10);
                console.log(`Got Nonce from blockchain: ${nonceKey} -- current nonce is : ${currentNonce}`);

                return currentNonce;
            } finally {
                // Release the lock
                console.log(`Releasing lock: ${lockKey}`);
                await redis.del(lockKey);
            }
        }
        console.log(`Retrying ${retries} times`);
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        retries++;
    }

    // If we couldn't acquire the lock after all retries, throw an error
    throw new Error(`Could not acquire lock for nonce after ${maxRetries} attempts`);
}

interface GasFees {
    maxPriorityFeePerGas: bigint;
    maxFeePerGas: bigint;
    lastUpdated: number;
}

/**
 * Fetches the current gas fees from the blockchain
 */
async function fetchCurrentFees(chainId: number): Promise<GasFees> {
    const publicClient = getPublicClientByChainId(chainId);
    const maxPriorityFee = await publicClient.estimateMaxPriorityFeePerGas();
    const feeData = await publicClient.estimateFeesPerGas();

    return {
        maxPriorityFeePerGas: maxPriorityFee,
        maxFeePerGas: feeData.maxFeePerGas,
        lastUpdated: Date.now()
    };
}

/**
 * Gets the priority fee from cache or fetches it if not available
 * @param chainId The blockchain chain ID
 * @returns The gas fee data
 */
async function getCurrentFees(chainId: number): Promise<GasFees> {

    if (chainId == monadTestnet.id) {
        // Hardcode fees for Monad testnet
        return {
            maxPriorityFeePerGas: BigInt(2_000_000_000),
            maxFeePerGas: BigInt(52_000_000_000),
            lastUpdated: Date.now()
        }
    }


    const cacheKey = `gas_fees:${chainId}`;

    // Try to get from cache first
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        // Convert string representations back to bigint
        return {
            maxPriorityFeePerGas: BigInt(parsedData.maxPriorityFeePerGas),
            maxFeePerGas: BigInt(parsedData.maxFeePerGas),
            lastUpdated: parsedData.lastUpdated
        };
    }
    const fees = await fetchCurrentFees(chainId);
    await redis.set(
        cacheKey,
        JSON.stringify({
            maxPriorityFeePerGas: fees.maxPriorityFeePerGas.toString(),
            maxFeePerGas: fees.maxFeePerGas.toString(),
            lastUpdated: fees.lastUpdated
        }),
        'EX',
        120
    );
    return fees;
}

// Function to initialize or update relayer keys in Redis
async function initializeRelayerKeys() {
    const envKeys = (process.env.RELAYER_PRIVATE_KEYS || '').split(',').filter(key => key.trim());

    // Get existing keys from Redis
    const existingKeys = await redis.zrange(RELAYER_KEYS_SET, 0, -1);

    // Compare sets
    const envSet = new Set(envKeys);
    const redisSet = new Set(existingKeys);
    // Check if sets are different
    if (envSet.size !== redisSet.size ||
        !Array.from(envSet).every(key => redisSet.has(key))) {
        // Clear existing set
        await redis.del(RELAYER_KEYS_SET);

        // Add all keys with score 0
        if (envKeys.length > 0) {
            const entries = envKeys.map(key => [0, key]);
            await redis.zadd(RELAYER_KEYS_SET, ...entries.flat());
        }
    }
}

const scorePublisherKey = (process.env.SCORE_PUBLISHER_PRIVATE_KEY || '0x') as HexString;

// Function to get a relayer key using atomic round-robin selection
async function getRelayerKeyWithRoundRobin(): Promise<HexString> {
    // Get the key with the lowest score directly
    const keys = await redis.zrange(RELAYER_KEYS_SET, 0, 0);

    if (!keys || keys.length === 0) {
        throw new Error('No relayer keys available');
    }

    const privateKey = keys[0] as HexString;

    // Increment the score atomically
    await redis.zincrby(RELAYER_KEYS_SET, 1, privateKey);

    return privateKey;
}

function createWorker() {
    // Worker to process transaction jobs
    const worker = new Worker<TxJobData>('transaction-processing', async job => {
        const {chainId, player, sessionId} = job.data;
        let relayerAddress: HexString | null = null;
        try {
            // Get a relayer key using the atomic round-robin function
            const privateKey = await getRelayerKeyWithRoundRobin();

            // Create an account from the selected private key
            const account = privateKeyToAccount(privateKey);

            const signerClient = getSignerClientByChainId(chainId);
            relayerAddress = account.address;
            const nonce = await getNonce(relayerAddress, chainId);
            const contract = getContractConfig('ScoreManager', chainId);
            await new Promise(resolve => setTimeout(resolve, 3000))
            const fees = await getCurrentFees(chainId);
            let txHash: HexString | null = null;
            switch (job.data.payload.type) {
                case 'UpdateHighscoreTx':
                    const {playerId} = job.data.payload

                    txHash = await signerClient.writeContract({
                        chain: undefined,
                        address: contract.address,
                        abi: contract.abi,
                        account,
                        functionName: "updateHighScore",
                        args: [player],
                        nonce,
                        maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
                        maxFeePerGas: fees.maxFeePerGas,
                        // gas: BigInt(75_000),
                    });

                    await prisma.gameOverRecord.update({
                        where: {
                            playerId_chainId_sessionId: {
                                playerId: playerId, chainId: chainId, sessionId: sessionId
                            }
                        },
                        data: {updateHighscoreTxHash: txHash},
                    });
                    break;
                case 'PlayerMoveTx':
                    const {playerMoveId} = job.data.payload
                    txHash = await signerClient.writeContract({
                        chain: undefined,
                        address: contract.address,
                        abi: contract.abi,
                        account,
                        functionName: "storeScore",
                        args: [player, BigInt(sessionId)],
                        nonce,
                        maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
                        maxFeePerGas: fees.maxFeePerGas,
                        // gas: BigInt(100_000),
                    });

                    await prisma.playerMove.update({
                        where: {id: playerMoveId},
                        data: {txHash},
                    });
                    break;
            }
            return txHash;
        } catch (e) {
            const error = e as WriteContractErrorType;
            if (
                error.name === 'ContractFunctionExecutionError' &&
                error.cause?.name === 'TransactionExecutionError' &&
                error.cause?.message.includes('nonce too low')
            ) {
                console.log('Nonce too low!');
                if (relayerAddress) {
                    console.log('Deleting bad nonce');
                    await deleteBadNonce(relayerAddress, chainId);
                }
            } else {
                console.error('Transaction processing failed:', error);
            }
            throw error;
        }
    }, {
        connection: redisConnection,
        concurrency: 100,
    });

    worker.on('completed', job => {
        console.log(`Job ${job.id} completed. Transaction hash: ${job.returnvalue}`);
    });

    worker.on('failed', (job, error) => {
        console.error(`Job ${job?.id} failed:`, error);
    });

    return worker;
}


function createSendUserScoreWorker() {
    // Worker to process send user score jobs
    const worker = new Worker<SendUserScoreJobData>('send-user-score', async job => {
        const {chainId, playerAddress, scoreAmount, transactionAmount, playerId, sessionId} = job.data;
        let signerAddress: HexString | null = null;

        try {
            console.log(`Processing send user score for player: ${playerAddress}, score: ${scoreAmount}, amount: ${transactionAmount}`);

            const account = privateKeyToAccount(scorePublisherKey);
            const signerClient = getSignerClientByChainId(chainId);
            signerAddress = account.address;
            const nonce = await getNonce(signerAddress, chainId);
            const fees = await getCurrentFees(chainId);
            const contract = getContractConfig('CentralLeaderboard', chainId);
            // i think this is to prevent rpc rate limit and leverage tx batching
            await new Promise(resolve => setTimeout(resolve, 3000))
            let txHash: HexString | null = null;
            txHash = await signerClient.writeContract({
                chain: undefined,
                address: contract.address,
                abi: contract.abi,
                account,
                functionName: "updatePlayerData",
                args: [playerAddress, BigInt(scoreAmount), BigInt(transactionAmount)],
                nonce,
                maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
                maxFeePerGas: fees.maxFeePerGas,
                // gas: BigInt(75_000),
            });

            await prisma.gameOverRecord.update({
                where: {
                    playerId_chainId_sessionId: {
                        playerId: playerId, chainId: chainId, sessionId: sessionId
                    }
                },
                data: {sendUserScoreTxHash: txHash},
            });
            console.log(`Successfully sent score for player: ${playerAddress}`);
            return txHash;

        } catch (e) {
            const error = e as WriteContractErrorType;
            if (
                error.name === 'ContractFunctionExecutionError' &&
                error.cause?.name === 'TransactionExecutionError' &&
                error.cause?.message.includes('nonce too low')
            ) {
                console.log('Nonce too low!');
                if (signerAddress) {
                    console.log('Deleting bad nonce');
                    await deleteBadNonce(signerAddress, chainId);
                }
            } else {
                console.error('Send user score failed:', error);
            }
            throw error;
        }
    }, {
        connection: redisConnection,
        concurrency: 1, // Process one job at a time
    });

    worker.on('completed', job => {
        console.log(`Send score job ${job.id} completed: ${job.returnvalue}`);
    });

    worker.on('failed', (job, error) => {
        console.error(`Send score job ${job?.id} failed:`, error);
    });

    return worker;
}

export default async function main() {
    try {
        await initializeRelayerKeys();
        const txWorker = createWorker();
        const scoreWorker = createSendUserScoreWorker();

        // Handle process termination
        process.on('SIGTERM', async () => {
            await txWorker.close();
            await scoreWorker.close();
            await redis.quit();
            await prisma.$disconnect();
        });
    } catch (error) {
        console.error('Failed to start workers:', error);
        process.exit(1);
    }
}