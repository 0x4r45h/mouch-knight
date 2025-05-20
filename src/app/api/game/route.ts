import { NextRequest, NextResponse } from 'next/server';
import { HexString } from "@/config";
import {fetchPlayerSessionId} from "@/services/newGameService";
import {UserContext} from "@farcaster/frame-core/esm/context";
import prisma from "@/db/client";


export async function POST(request: NextRequest) {
    const body = await request.json();
    const from: HexString = body.from;
    const chainId: number = body.chain_id;
    const farcasterUser: UserContext | null = body.farcaster_user;

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
                    address: from,
                    fId: farcasterUser?.fid,
                    fUsername: farcasterUser?.username,
                    fDisplayName: farcasterUser?.displayName,
                    fPfpUrl: farcasterUser?.pfpUrl,
                    fLocationDescription: farcasterUser?.location?.description,
                    fLocationPlaceId: farcasterUser?.location?.placeId,
                }
            });
        }
        const sessionId = await fetchPlayerSessionId(from, chainId);
        return NextResponse.json({
            message: 'new session registered',
            data: { session_id: sessionId }
        });
    } catch (e) {
        console.log(e);
        return NextResponse.json({
            success: false,
            message: "new game failed",
            data: { error: e }
        }, { status: 500 });
    }
}