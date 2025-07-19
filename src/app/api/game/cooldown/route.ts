import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/db/client";
import { gameConfig } from '@/config/gameConfig';

export async function GET(request: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(request.url);
    const player = searchParams.get('player');
    
    if (!player) {
        return NextResponse.json({ 
            success: false, 
            message: "player address is required" 
        }, { status: 422 });
    }
    
    try {
        // Get cooldown duration from config
        const cooldownSeconds = gameConfig.cooldown.durationSeconds;
        
        // Find player and their cooldown
        const playerRecord = await prisma.player.findUnique({
            where: { address: player },
            include: { cooldown: true }
        });
        
        if (playerRecord?.cooldown) {
            const lastPlayed = playerRecord.cooldown.lastPlayed;
            const cooldownEnds = new Date(lastPlayed.getTime() + cooldownSeconds * 1000);
            const now = new Date();
            
            if (now < cooldownEnds) {
                // Player is still in cooldown
                const remainingSeconds = Math.ceil((cooldownEnds.getTime() - now.getTime()) / 1000);
                
                return NextResponse.json({
                    message: 'Player in cooldown',
                    data: { 
                        cooldown: true,
                        remainingSeconds,
                        cooldownEnds: cooldownEnds.toISOString()
                    }
                });
            }
        }
        
        // No cooldown or cooldown has expired
        return NextResponse.json({
            message: 'Player not in cooldown',
            data: { cooldown: false }
        });
    } catch (error) {
        console.error('Error checking cooldown:', error);
        return NextResponse.json({
            success: false,
            message: "Failed to check cooldown"
        }, { status: 500 });
    }
}