
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const moveIds = searchParams.get('moveIds')?.split(',').map(Number);

        if (!moveIds || !Array.isArray(moveIds)) {
            return NextResponse.json({ error: "Invalid moveIds" }, { status: 400 });
        }

        const moves = await prisma.playerMove.findMany({
            where: {
                id: {
                    in: moveIds
                },
                txHash: {
                    not: null
                }
            },
            select: {
                id: true,
                txHash: true
            }
        });

        const txHashMap = moves.reduce((acc, move) => ({
            ...acc,
            [move.id]: move.txHash
        }), {});

        return NextResponse.json({
            message: 'Transaction hashes fetched',
            data: txHashMap
        });
    } catch (error) {
        console.error('Error fetching tx hashes:', error);
        return NextResponse.json({ 
            error: "Failed to fetch transaction hashes" 
        }, { status: 500 });
    }
}
