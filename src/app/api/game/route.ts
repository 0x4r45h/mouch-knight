import {createPublicClient, http} from 'viem';
import { anvil } from 'viem/chains';
import {NextRequest, NextResponse} from 'next/server';
import {contractAddresses, HexString} from "@/config";
import { scoreManagerAbi} from "@/generated";

export async function POST(request: NextRequest) {
    const body = await request.json()
    const from = body.from
    try {
        const sessionId = await fetchPlayerSessionId(from)
    return NextResponse.json({message: 'new session generated', data : {session_id : sessionId.toString()}})
    } catch (e) {
        console.log(e)
        return NextResponse.json({ success: false, message: "query Failed", data:{ error : e } }, { status: 500 });
    }
}

const RPC_URL = 'http://127.0.0.1:8545';

const publicClient = createPublicClient({
    chain: anvil,
    transport: http(RPC_URL)
})

async function fetchPlayerSessionId(player: HexString) {
    return await publicClient.readContract({
        address: contractAddresses.ScoreManager,
        abi: scoreManagerAbi,
        functionName: "getPlayerNextSession",
        args: [player]
    })
}
