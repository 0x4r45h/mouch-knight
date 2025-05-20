import {getContractConfig, getPublicClientByChainId} from "@/config";
import highScoreService from "@/services/highScoreService";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import prisma from "@/db/client";

const STEP = BigInt(100);

async function listenForHighScores(chainId: number) {
    // Configure the client
    const client = getPublicClientByChainId(chainId);
    const contractConfig = getContractConfig('ScoreManager', chainId);

    // Get the last scanned block or use deployed block as fallback
    let currentBlock = await getLastScannedBlock(chainId) || contractConfig.deployedBlock;
    console.log(`chain '${chainId}' - Starting from block ${currentBlock}`);

    while (true) {
        try {
            const latestBlock = await client.getBlockNumber();
            if (currentBlock >= latestBlock) {
                console.log(`chain '${chainId}' - current start block is ${currentBlock} and latest block is ${latestBlock}`);
                await new Promise(resolve => setTimeout(resolve, 10000)); // Wait for 10s
                continue;
            }
            const endBlock = currentBlock + BigInt(STEP) < latestBlock ? currentBlock + BigInt(STEP) : latestBlock;

            console.log(`chain '${chainId}' - Fetching events from ${currentBlock} to ${endBlock}`);
            // Fetch events
            const logs = await client.getLogs({
                fromBlock: currentBlock,
                toBlock: endBlock,
                address: contractConfig.address,
                strict: true,
                event: {
                    type: 'event',
                    anonymous: false,
                    inputs: [
                        {
                            name: 'player',
                            internalType: 'address',
                            type: 'address',
                            indexed: true,
                        },
                        {
                            name: 'session',
                            internalType: 'uint256',
                            type: 'uint256',
                            indexed: false,
                        },
                        {
                            name: 'score',
                            internalType: 'uint256',
                            type: 'uint256',
                            indexed: false,
                        },
                    ],
                    name: 'HighScoreUpdated',
                }
            });

            for (const log of logs) {
                const playerAddress = log.args.player;
                const score = Number(log.args.score);
                const sessionId = Number(log.args.session);
                console.log(`chain '${chainId}' - Player: ${playerAddress}, Score: ${score} on session ${sessionId}`);

                // Store in database using Prisma
                try {
                    await highScoreService.insertHighScore({
                        score,
                        sessionId,
                        chainId,
                        playerAddress
                    });
                } catch (error) {
                    // Check if it's a unique constraint violation
                    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
                        console.log(`chain '${chainId}' - Skipping duplicate record for player: ${playerAddress}, session: ${sessionId}`);
                    } else {
                        // Re-throw if it's a different error
                        console.error(`chain '${chainId}' - Error inserting high score:`, error);
                    }
                }
            }

            currentBlock = endBlock + BigInt(1);

            // Save the last scanned block to database
            await saveLastScannedBlock(chainId, currentBlock);

            // Wait to prevent rate-limiting
            const waitTime = chainId === 31337 ? 0 : 3000; // 31337 is anvil.id
            await new Promise(resolve => setTimeout(resolve, waitTime));
        } catch (error) {
            console.error(`chain '${chainId}' - Error fetching events:`, error);
            await new Promise(resolve => setTimeout(resolve, 10000)); // Wait for 10s before retrying
        }
    }
}

// Function to get the last scanned block from the database
async function getLastScannedBlock(chainId: number): Promise<bigint | null> {
    try {
        const blockTracker = await prisma.blockTracker.findUnique({
            where: {
                chainId_contractName: {
                    chainId,
                    contractName: 'ScoreManager'
                }
            }
        });

        return blockTracker ? BigInt(blockTracker.lastScannedBlock) : null;
    } catch (error) {
        console.error(`Error getting last scanned block for chain ${chainId}:`, error);
        return null;
    }
}

// Function to save the last scanned block to the database
async function saveLastScannedBlock(chainId: number, blockNumber: bigint): Promise<void> {
    try {
        await prisma.blockTracker.upsert({
            where: {
                chainId_contractName: {
                    chainId,
                    contractName: 'ScoreManager'
                }
            },
            update: {
                lastScannedBlock: blockNumber.toString()
            },
            create: {
                chainId,
                contractName: 'ScoreManager',
                lastScannedBlock: blockNumber.toString()
            }
        });
    } catch (error) {
        console.error(`Error saving last scanned block for chain ${chainId}:`, error);
    }
}

// Add a main function to run the script
export default async function main() {
    try {
        const backendChainIds = (process.env.NEXT_BACKEND_CHAIN_IDS || '')
            .split(',')
            .map(id => id.trim())  // Remove any extra spaces
            .filter(id => id)      // Filter out empty strings
            .map(id => Number(id));
        console.log('backend chains', backendChainIds);
        backendChainIds.forEach(chainId => {
            console.log(`Starting high score listener for chain ${chainId}...`);
            listenForHighScores(chainId)
        })
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}