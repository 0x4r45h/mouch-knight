import { NextRequest, NextResponse } from 'next/server';
import { HexString } from "@/config";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    const body = await request.json();
    const from: HexString = body.from;
    const sessionId: string = body.session_id;

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