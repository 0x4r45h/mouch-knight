import {NextRequest, NextResponse} from "next/server";
import highScoreService from '@/services/highScoreService';
import {addTxJob} from "@/services/queue";

export async function GET(request: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(request.url);
    const chainId = searchParams.get('chain_id');

    if (!chainId) {
        return NextResponse.json({ success: false, message: "chain_id is required" }, { status: 422 });
    }

    try {
        // Fetch leaderboard from the database using Prisma
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
        const jobId = await addTxJob({
            chainId,
            player: player,
            payload: {
                type: 'UpdateHighscoreTx',
            },
        }, {
            delay: 5000 // 5 seconds delay
        });
        console.log(`Job ID is ${jobId}`);
        return NextResponse.json({ message: 'Highscore update job submitted', data: { jobId } });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ success: false, message: "Tx Failed", data: { error: e } }, { status: 500 });
    }
}
