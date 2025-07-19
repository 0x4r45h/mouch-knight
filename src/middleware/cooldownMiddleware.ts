import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/db/client";
import { gameConfig } from '@/config/gameConfig';

export async function cooldownMiddleware(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  // Only apply to new game API route
  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const playerAddress = body.from;
      
      // Get cooldown duration from env (default to 1 hour if not set)
      const cooldownSeconds = gameConfig.cooldown.durationSeconds;

      // Find player and their cooldown
      const player = await prisma.player.findUnique({
        where: { address: playerAddress },
        include: { cooldown: true }
      });
      
      if (player?.cooldown) {
        const lastPlayed = player.cooldown.lastPlayed;
        const cooldownEnds = new Date(lastPlayed.getTime() + cooldownSeconds * 1000);
        const now = new Date();
        
        if (now < cooldownEnds) {
          // Player is still in cooldown
          const remainingSeconds = Math.ceil((cooldownEnds.getTime() - now.getTime()) / 1000);
          
          return NextResponse.json({
            success: false,
            message: "You need to wait before starting a new game",
            data: { 
              cooldown: true,
              remainingSeconds,
              cooldownEnds: cooldownEnds.toISOString()
            }
          }, { status: 429 });
        }
      }
      
      // Clone the request with the parsed body
      const newRequest = new NextRequest(request.url, {
        method: request.method,
        headers: request.headers,
        body: JSON.stringify(body),
      });
      
      return handler(newRequest);
    } catch (error) {
      console.error("Error in cooldown middleware:", error);
      return NextResponse.json({
        success: false,
        message: "Server error processing cooldown",
        data: { error: "Internal server error" }
      }, { status: 500 });
    }
  }
  
  // For non-POST requests, just pass through
  return handler(request);
}