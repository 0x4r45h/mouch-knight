import {NextRequest, NextResponse} from "next/server";
import {PRIVATE_KEYS, processQueue, txQueue} from "@/app/api/game/queue";
import {getContractConfig, HexString} from "@/config";
import {PrivateKeyAccount, WalletClient} from "viem";
import crypto from 'crypto';

// The same secret key used in the WASM module
const SECRET_KEY = "f3a9b5c7d1e8f2a4b6c8d0e2f4a6b8c0"; // Replace with your own secret key

// Function to verify the hash from the client
function verifyHash(
    playerAddress: string,
    score: number,
    chainId: number,
    sessionId: number,
    timestamp: number,
    clientHash: string
): boolean {
    // Allow a 10sec window for the timestamp to prevent replay attacks
    const currentTime = Math.floor(Date.now() / 1000);
    if (Math.abs(currentTime - timestamp) > 10) {
        console.error("Timestamp is too old or from the future");
        return false;
    }

    // Recreate the hash on the server side
    const payload = `${SECRET_KEY}:${playerAddress}:${score}:${chainId}:${sessionId}:${timestamp}`;
    const serverHash = crypto
        .createHash('sha256')
        .update(payload)
        .digest('hex');

    // Compare the hashes
    return serverHash === clientHash;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    const body = await request.json();
    const player = body.player;
    const sessionId = body.session_id;
    const chainId = body.chain_id;
    const score = body.score;
    const verification = body.verification;

    // Verify the hash
    if (!verification || !verification.hash || !verification.timestamp) {
        return NextResponse.json({ error: "Missing verification data" }, { status: 400 });
    }

    const isValid = verifyHash(
        player,
        score,
        chainId,
        sessionId,
        verification.timestamp,
        verification.hash
    );

    if (!isValid) {
        return NextResponse.json({ error: "Invalid verification hash" }, { status: 403 });
    }

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