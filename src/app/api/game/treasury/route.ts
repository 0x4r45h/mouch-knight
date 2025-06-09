import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/db/client";
import { Decimal } from '@prisma/client/runtime/library';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const chainId = searchParams.get('chain_id');

    if (!chainId) {
      return NextResponse.json({ success: false, message: "chain_id is required" }, { status: 422 });
    }

    // Get initial balance from environment variable (default to 0 if not set)
    const initialBalance = new Decimal(process.env.NEXT_PUBLIC_TREASURY_INITIAL_BALANCE || "0");

    // Sum all native token purchases
    const nativePurchases = await prisma.sessionPurchase.aggregate({
      _sum: {
        totalCost: true
      },
      where: {
        chainId: Number(chainId),
        paymentMethod: 'native'
      }
    });

    // Calculate total treasury balance using Decimal arithmetic
    const totalNativePurchases = nativePurchases._sum.totalCost || new Decimal(0);
    const totalBalance = initialBalance.add(totalNativePurchases);

    return NextResponse.json({
      success: true,
      message: 'Treasury balance fetched',
      data: {
        initialBalance: initialBalance.toFixed(),
        totalNativePurchases: totalNativePurchases.toFixed(),
        totalBalance: totalBalance.toFixed()
      }
    });
  } catch (error) {
    console.error('Error fetching treasury balance:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch treasury balance"
    }, { status: 500 });
  }
}