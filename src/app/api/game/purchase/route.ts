import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/db/client";
import { HexString } from "@/config";

interface PurchaseRequest {
  player: HexString;
  chain_id: number;
  tx_hash: HexString;
  payment_method: 'mkt' | 'native';
  quantity: number;
  total_cost: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: PurchaseRequest = await request.json();
    
    // Validate required fields
    if (!body.player || !body.chain_id || !body.tx_hash || !body.payment_method || !body.quantity) {
      return NextResponse.json({
        success: false,
        message: "Missing required fields"
      }, { status: 400 });
    }
    
    // Get or create player
    const player = await prisma.player.upsert({
      where: { address: body.player },
      create: { address: body.player },
      update: {}
    });
    
    // Record the purchase
    const purchase = await prisma.sessionPurchase.create({
      data: {
        playerId: player.id,
        chainId: body.chain_id,
        txHash: body.tx_hash,
        paymentMethod: body.payment_method,
        quantity: body.quantity,
        totalCost: body.total_cost
      }
    });
    
    // Reset the player's cooldown to allow immediate play
    await prisma.playerCooldown.upsert({
      where: { playerId: player.id },
      create: {
        playerId: player.id,
        lastPlayed: new Date(0) // Set to a date in the past to bypass cooldown
      },
      update: {
        lastPlayed: new Date(0) // Set to a date in the past to bypass cooldown
      }
    });
    
    return NextResponse.json({
      success: true,
      message: "Purchase successful",
      data: { purchase_id: purchase.id }
    });
  } catch (error) {
    console.error('Error processing purchase:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to process purchase"
    }, { status: 500 });
  }
}