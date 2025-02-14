import {createPublicClient, PrivateKeyAccount, WalletClient} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import {NextRequest, NextResponse} from 'next/server';
import {getContractConfig, getPublicClientByChainId, getSignerClientByChainId, HexString} from "@/config";

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
    chainId : number,
    execute: (account: PrivateKeyAccount, nonce: number, signerClient: WalletClient, chainId: number) => Promise<HexString>;
};
const txQueue: QueuedTx[] = [];
const busyKeys = new Set<string>();
let isCheckingQueue = false;
const relayersNonce = new Map<HexString,number>();

async function getAvailableKey(): Promise<HexString | undefined> {
    const key = PRIVATE_KEYS.find(key => !busyKeys.has(key));
    console.log("Available keys:", PRIVATE_KEYS.filter(key => !busyKeys.has(key)).length);
    return key;
}
async function getAccountNonce(address: HexString, pubClient: ReturnType<typeof createPublicClient>) {
    if (relayersNonce.has(address)) {
        const currentNonce =  relayersNonce.get(address);
        if (currentNonce) {
            console.log(`Using Cached nonce: ${currentNonce}`)
            return currentNonce;
        }
    }
    const nonce = await pubClient.getTransactionCount({
        address,
    })
    relayersNonce.set(address,nonce);
    console.log(`Fetched nonce: ${nonce}`)

    return nonce;
}
async function processSingleTransaction(privateKey: HexString, tx: QueuedTx) {
    const startTime = Date.now();
    const account = privateKeyToAccount(privateKey);
    try {
        const pubClient = getPublicClientByChainId(tx.chainId)

        // Execute transaction and get the hash
        const signerClient = getSignerClientByChainId(tx.chainId);
        signerClient.account = account;

        const nonce = await getAccountNonce(account.address, pubClient)
        const hash = await tx.execute(account, nonce, signerClient, tx.chainId);

        console.log("Transaction sent:", hash, "waiting for confirmation...");

        // Dont wait for transaction to be confirmed, just increase the cached nonce and move on
        relayersNonce.set(account.address, nonce + 1);
        reportTxStatus(hash, pubClient)
    } catch (error) {
        console.error("Error processing tx:", error);
        // in case of error delete the nonce cache, to be fetched again from network on next request
        relayersNonce.delete(account.address)
    } finally {
        busyKeys.delete(privateKey);
        console.log("Freed key:", privateKey.slice(-4), "Time taken:", Date.now() - startTime, "ms");
    }
}
async function reportTxStatus(hash : HexString, pubClient: ReturnType<typeof createPublicClient>) {
    const receipt = await pubClient.waitForTransactionReceipt({ hash });
    console.log(`Transaction ${receipt.transactionHash} confirmed in block:`,  receipt.blockNumber);
}

async function processQueue() {
    if (isCheckingQueue) return;
    isCheckingQueue = true;

    while (txQueue.length > 0) {
        const privateKey = await getAvailableKey();
        if (!privateKey) {
            // If no keys available, wait 100ms and check again
            await new Promise(resolve => setTimeout(resolve, 100));
            continue;
        }

        console.log("Using key:", privateKey.slice(-4), "Queue length:", txQueue.length);
        busyKeys.add(privateKey);
        const tx = txQueue.shift();
        if (tx) {
            // Process transaction without waiting for it
            processSingleTransaction(privateKey, tx);
        } else {
            busyKeys.delete(privateKey);
        }
    }

    isCheckingQueue = false;
}
export async function POST(request: NextRequest) {
    // TODO : prevent reply attacks and do some validations
    const body = await request.json()
    const player = body.player
    const sessionId = body.session_id
    const chainId = body.chain_id
    if (PRIVATE_KEYS.length === 0) {
        return NextResponse.json({ error: "No private keys configured" }, { status: 500 });
    }
    try {
        // Add transaction to queue
        txQueue.push({
            chainId,
            execute: async (account, nonce,  signerClient, chainId) => {
                 return await storeScoreOnChain(player as HexString, BigInt(sessionId), account,chainId, nonce, signerClient)
            },
        });
        // Try to process queue
        processQueue();
        return NextResponse.json({message: 'Score Submitted', data : {}})
    } catch (e) {
        console.error(e)
        return NextResponse.json({ success: false, message: "Tx Failed", data:{ error : e } }, { status: 500 });
    }
}
const storeScoreOnChain = async (player: HexString, sessionIndex: bigint, account: PrivateKeyAccount, chainId: number,  nonce: number, signerClient: WalletClient): Promise<HexString> => {
    const { abi, address } = getContractConfig('ScoreManager', chainId)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    return await signerClient.writeContract({
        address,
        abi,
        functionName: "storeScore",
        args: [player, sessionIndex],
        account,
        nonce,
    })
}