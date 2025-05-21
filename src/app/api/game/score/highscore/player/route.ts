import {NextRequest, NextResponse} from "next/server";
import highScoreService from '@/services/highScoreService';

export async function GET(request: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(request.url);
    const chainId = searchParams.get('chain_id');
    const player = searchParams.get('player');

    if (!chainId || !player) {
        return NextResponse.json({ success: false, message: "chain_id and player are required" }, { status: 422 });
    }

    try {
        const playerHighscore = await highScoreService.getPlayerHighscore(player, Number(chainId));
        
        return NextResponse.json({
            message: 'Player highscore fetched',
            data: { highscore: playerHighscore }
        });
    } catch (error) {
        console.error('Error fetching player highscore:', error);
        return NextResponse.json({
            success: false,
            message: "Failed to fetch player highscore"
        }, { status: 500 });
    }
}