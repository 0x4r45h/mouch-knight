import {NextRequest, NextResponse} from "next/server";
import highScoreService from '@/services/highScoreService';

export async function GET(request: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(request.url);
    const chainId = searchParams.get('chain_id');
    const mode = searchParams.get('mode') || 'full';

    if (!chainId) {
        return NextResponse.json({ success: false, message: "chain_id is required" }, { status: 422 });
    }

    try {
        const scores = await highScoreService.getLeaderboard(Number(chainId), 100000, mode as 'farcaster' | 'monad-id' | 'full');

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