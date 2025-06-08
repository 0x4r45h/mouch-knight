import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/db/client";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const chainId = searchParams.get('chain_id');

    if (!chainId) {
      return NextResponse.json({ success: false, message: "chain_id is required" }, { status: 422 });
    }

    // Get initial balance from environment variable (default to 0 if not set)
    const initialBalance = process.env.NEXT_PUBLIC_TREASURY_INITIAL_BALANCE || "0";

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

    // Calculate total treasury balance
    const totalNativePurchases = nativePurchases._sum.totalCost || "0";
    const totalBalance = BigInt(initialBalance) + BigInt(totalNativePurchases);

    return NextResponse.json({
      success: true,
      message: 'Treasury balance fetched',
      data: {
        initialBalance: initialBalance.toString(),
        totalNativePurchases: totalNativePurchases.toString(),
        totalBalance: totalBalance.toString()
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