import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/db/client";

export async function GET(request: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    
    if (!address) {
        return NextResponse.json({ 
            success: false, 
            message: "address is required" 
        }, { status: 422 });
    }
    
    try {
        const player = await prisma.player.findUnique({
            where: { address },
            select: {
                id: true,
                address: true,
                fId: true,
                fUsername: true,
                fDisplayName: true,
                fPfpUrl: true,
                fLocationDescription: true,
                fLocationPlaceId: true,
                mUsername: true,
                createdAt: true,
                updatedAt: true
            }
        });
        
        if (!player) {
            return NextResponse.json({ 
                success: false, 
                message: "Player not found" 
            }, { status: 404 });
        }
        
        return NextResponse.json({
            success: true,
            message: 'Player fetched successfully',
            data: { player }
        });
    } catch (error) {
        console.error('Error fetching player:', error);
        return NextResponse.json({
            success: false,
            message: "Failed to fetch player"
        }, { status: 500 });
    }
}