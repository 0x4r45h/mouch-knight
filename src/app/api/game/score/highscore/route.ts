import {NextRequest, NextResponse} from "next/server";
import {addTxJob} from "@/services/queue";

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
            type: "TxJobData"
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
