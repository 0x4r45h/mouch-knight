import { NextRequest, NextResponse } from 'next/server';
import { getContractConfig, getPublicClientByChainId, HexString } from "@/config";

export async function POST(request: NextRequest) {
    const body = await request.json();
    const from: HexString = body.from;
    const chainId: number = body.chain_id;

    try {
        const sessionId = await fetchPlayerSessionId(from, chainId);
        return NextResponse.json({ message: 'new session generated', data: { session_id: sessionId.toString() } });
    } catch (e) {
        console.log(e);
        return NextResponse.json({ success: false, message: "query Failed", data: { error: e } }, { status: 500 });
    }
}

async function fetchPlayerSessionId(player: HexString, chainId: number): Promise<string> {
    const { abi, address } = getContractConfig('ScoreManager', chainId);
    const pubClient = getPublicClientByChainId(chainId);
    const sessionId = await pubClient.readContract({
        address,
        abi,
        functionName: "getPlayerNextSession",
        args: [player]
    });

    // Assuming sessionId is returned as a string or can be converted to a string
    return sessionId as string;
}