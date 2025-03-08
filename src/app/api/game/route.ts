import { NextRequest, NextResponse } from 'next/server';
import { getContractConfig, getPublicClientByChainId, HexString } from "@/config";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    const body = await request.json();
    const from: HexString = body.from;
    const chainId: number = body.chain_id;

    try {
        // Get or create player when starting a new game
        const player = await prisma.player.findUnique({
            where: {
                address: from
            }
        });

        if (!player) {
            await prisma.player.create({
                data: {
                    address: from
                }
            });
        }

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