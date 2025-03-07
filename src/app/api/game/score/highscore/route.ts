import {NextRequest, NextResponse} from "next/server";
import { processQueue, txQueue} from "@/app/api/game/queue";
import {getContractConfig, HexString} from "@/config";
import {PrivateKeyAccount, WalletClient} from "viem";
import highScoreService from '@/services/highScoreService';

export async function GET(request: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(request.url);
    const chainId = searchParams.get('chain_id');

    if (!chainId) {
        return NextResponse.json({ success: false, message: "chain_id is required" }, { status: 422 });
    }

    try {
        // Fetch leaderboard from database using Prisma
        const scores = await highScoreService.getLeaderboard(Number(chainId),100000);

        return NextResponse.json({
            message: 'Leaderboard fetched',
            data: { leaderboard: scores }
        });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return NextResponse.json({
            success: false,
            message: "Failed to fetch leaderboard"
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    const body = await request.json();
    const player = body.player;
    const chainId = body.chain_id;
    try {
        // Create a promise that resolves when the transaction executes.
        const txPromise: Promise<HexString> = new Promise((resolve, reject) => {
            txQueue.push({
                chainId,
                execute: async (account, nonce, signerClient, chainId) => {
                    return await invokeOnchainHighscoreUpdater(player as HexString, account, chainId, nonce, signerClient);
                },
                resolve,
                reject,
            });
        });

        // Begin processing the queue.
        processQueue();
        // Await the promise so we can return the tx hash.
        const txHash = await txPromise;
        return NextResponse.json({ message: 'Highscore update submitted', data: { txHash } });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ success: false, message: "Tx Failed", data: { error: e } }, { status: 500 });
    }
}

const invokeOnchainHighscoreUpdater = async (
    player: HexString,
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
        functionName: "updateHighScore",
        args: [player],
        account,
        nonce,
    });
};