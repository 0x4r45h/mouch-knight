import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/db/client";

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const body = await request.json();
        const { address } = body;
        
        if (!address) {
            return NextResponse.json({ 
                success: false, 
                message: "address is required" 
            }, { status: 422 });
        }
        
        // Create player if doesn't exist (upsert with no updates)
        const player = await prisma.player.upsert({
            where: { address },
            create: {
                address
            },
            update: {}, // No updates, just ensure player exists
            select: {
                id: true,
                address: true,
                createdAt: true
            }
        });
        
        return NextResponse.json({
            success: true,
            message: 'Player created/verified successfully',
            data: { player }
        });
    } catch (error) {
        console.error('Error creating player:', error);
        return NextResponse.json({
            success: false,
            message: "Failed to create player"
        }, { status: 500 });
    }
}
