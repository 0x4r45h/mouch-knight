import { createPublicClient, PrivateKeyAccount, WalletClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { NextRequest, NextResponse } from 'next/server';
import { getContractConfig, getPublicClientByChainId, getSignerClientByChainId, HexString } from "@/config";

// Initialize private keys
const PRIVATE_KEYS = [
    process.env.RELAYER_PRIVATE_KEY,
    process.env.RELAYER_PRIVATE_KEY_2,
    process.env.RELAYER_PRIVATE_KEY_3,
    process.env.RELAYER_PRIVATE_KEY_4,
    process.env.RELAYER_PRIVATE_KEY_5,
    process.env.RELAYER_PRIVATE_KEY_6,
    process.env.RELAYER_PRIVATE_KEY_7,
    process.env.RELAYER_PRIVATE_KEY_8,
    process.env.RELAYER_PRIVATE_KEY_9,
    process.env.RELAYER_PRIVATE_KEY_10,
].filter((key): key is HexString => !!key);

type QueuedTx = {
    chainId: number;
    execute: (account: PrivateKeyAccount, nonce: number, signerClient: WalletClient, chainId: number) => Promise<HexString>;
    resolve: (hash: HexString) => void;
    reject: (error: unknown) => void;
};

const txQueue: QueuedTx[] = [];
const busyKeys = new Set<string>();
let isCheckingQueue = false;
const relayersNonce = new Map<HexString, number>();

async function getAvailableKey(): Promise<HexString | undefined> {
    const availableKeys = PRIVATE_KEYS.filter(key => !busyKeys.has(key));
    console.log("Available keys:", availableKeys.length);
    return availableKeys[0];
}

async function getAccountNonce(address: HexString, pubClient: ReturnType<typeof createPublicClient>): Promise<number> {
    if (relayersNonce.has(address)) {
        const currentNonce = relayersNonce.get(address);
        if (currentNonce) {
            console.log(`Using Cached nonce: ${currentNonce}`);
            return currentNonce;
        }
    }
    const nonce = await pubClient.getTransactionCount({ address });
    relayersNonce.set(address, nonce);
    console.log(`Fetched nonce: ${nonce}`);
    return nonce;
}

async function processSingleTransaction(privateKey: HexString, queuedTx: QueuedTx): Promise<void> {
    const startTime = Date.now();
    const account = privateKeyToAccount(privateKey);
    try {
        const pubClient = getPublicClientByChainId(queuedTx.chainId);
        const signerClient = getSignerClientByChainId(queuedTx.chainId);
        // Set the signer account to the current account.
        signerClient.account = account;
        const nonce = await getAccountNonce(account.address, pubClient);
        // Execute transaction and get the hash.
        const hash = await queuedTx.execute(account, nonce, signerClient, queuedTx.chainId);
        console.log("Transaction sent:", hash, "waiting for confirmation...");

        // Increase the cached nonce without waiting for confirmation.
        relayersNonce.set(account.address, nonce + 1);
        // Optionally, report tx status without awaiting the result.
        reportTxStatus(hash, pubClient);

        // Resolve the promise so the POST handler can return the tx hash.
        queuedTx.resolve(hash);
    } catch (error) {
        console.error("Error processing transaction:", error);
        // Remove the cached nonce in case of error.
        relayersNonce.delete(account.address);
        // Reject the promise so the POST handler can catch the error.
        queuedTx.reject(error);
    } finally {
        busyKeys.delete(privateKey);
        console.log("Freed key:", privateKey.slice(-4), "Time taken:", Date.now() - startTime, "ms");
    }
}

async function reportTxStatus(hash: HexString, pubClient: ReturnType<typeof createPublicClient>) {
    try {
        const receipt = await pubClient.waitForTransactionReceipt({ hash });
        console.log(`Transaction ${receipt.transactionHash} confirmed in block:`, receipt.blockNumber);
    } catch (error) {
        console.error(`Error waiting for transaction confirmation for hash ${hash}:`, error);
    }
}

async function processQueue(): Promise<void> {
    if (isCheckingQueue) return;
    isCheckingQueue = true;
    while (txQueue.length > 0) {
        const privateKey = await getAvailableKey();
        if (!privateKey) {
            // If no keys available, wait briefly and retry.
            await new Promise(resolve => setTimeout(resolve, 100));
            continue;
        }
        console.log("Using key:", privateKey.slice(-4), "Queue length:", txQueue.length);
        busyKeys.add(privateKey);
        const queuedTx = txQueue.shift();
        if (queuedTx) {
            processSingleTransaction(privateKey, queuedTx);
        } else {
            busyKeys.delete(privateKey);
        }
    }
    isCheckingQueue = false;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    // TODO: prevent replay attacks and perform validations
    const body = await request.json();
    const player = body.player;
    const sessionId = body.session_id;
    const chainId = body.chain_id;
    if (PRIVATE_KEYS.length === 0) {
        return NextResponse.json({ error: "No private keys configured" }, { status: 500 });
    }
    try {
        // Create a promise that resolves when the transaction executes.
        const txPromise: Promise<HexString> = new Promise((resolve, reject) => {
            txQueue.push({
                chainId,
                execute: async (account, nonce, signerClient, chainId) => {
                    return await storeScoreOnChain(player as HexString, BigInt(sessionId), account, chainId, nonce, signerClient);
                },
                resolve,
                reject,
            });
        });

        // Begin processing the queue.
        processQueue();
        // Await the promise so we can return the tx hash.
        const txHash = await txPromise;
        return NextResponse.json({ message: 'Score Submitted', data: { txHash } });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ success: false, message: "Tx Failed", data: { error: e } }, { status: 500 });
    }
}

const storeScoreOnChain = async (
    player: HexString,
    sessionIndex: bigint,
    account: PrivateKeyAccount,
    chainId: number,
    nonce: number,
    signerClient: WalletClient
): Promise<HexString> => {
    const { abi, address } = getContractConfig('ScoreManager', chainId);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    return await signerClient.writeContract({
        address,
        abi,
        functionName: "storeScore",
        args: [player, sessionIndex],
        account,
        nonce,
    });
};