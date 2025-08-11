import { NextRequest, NextResponse } from 'next/server';
import { HexString } from "@/config";
import { fetchPlayerSessionId } from "@/services/newGameService";
import { UserContext } from "@farcaster/frame-core/esm/context";
import prisma from "@/db/client";
import { cooldownMiddleware } from "@/middleware/cooldownMiddleware";

async function handler(request: NextRequest) {
    const body = await request.json();
    const from: HexString = body.from;
    const chainId: number = body.chain_id;
    const farcasterUser: UserContext | null = body.farcaster_user;

    try {
        // Check Rainbow provider requirement
        if (process.env.NEXT_PUBLIC_WALLET_PROVIDER === 'rainbow') {
            const existingPlayer = await prisma.player.findUnique({
                where: { address: from },
                select: { mUsername: true }
            });
            
            if (!existingPlayer?.mUsername) {
                return NextResponse.json({
                    success: false,
                    message: "Monad username required for Rainbow provider"
                }, { status: 403 });
            }
        }

        // Upsert player when starting a new game
        const player = await prisma.player.upsert({
            where: {
                address: from
            },
            create: {
                address: from,
                fId: farcasterUser?.fid,
                fUsername: farcasterUser?.username,
                fDisplayName: farcasterUser?.displayName,
                fPfpUrl: farcasterUser?.pfpUrl,
                fLocationDescription: farcasterUser?.location?.description,
                fLocationPlaceId: farcasterUser?.location?.placeId,
            },
            update: {
                fId: farcasterUser?.fid,
                fUsername: farcasterUser?.username,
                fDisplayName: farcasterUser?.displayName,
                fPfpUrl: farcasterUser?.pfpUrl,
                fLocationDescription: farcasterUser?.location?.description,
                fLocationPlaceId: farcasterUser?.location?.placeId,
            }
        });

        // Update or create cooldown record
        await prisma.playerCooldown.upsert({
            where: {
                playerId: player.id
            },
            create: {
                playerId: player.id,
                lastPlayed: new Date()
            },
            update: {
                lastPlayed: new Date()
            }
        });

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

export async function POST(request: NextRequest) {
    return cooldownMiddleware(request, handler);
}