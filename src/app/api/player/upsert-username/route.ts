import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/db/client";
import {MONAD_USERNAME_API} from "@/config";

async function fetchMonadUsername(address: string): Promise<string | null> {
    try {
        console.log(`URL IS : '${MONAD_USERNAME_API}/check-wallet?wallet=${address}'`)
        const response = await fetch(`${MONAD_USERNAME_API}/check-wallet?wallet=${address}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            //     // Add any required API keys or headers
            //     ...(process.env.MONAD_USERNAME_API_KEY && {
            //         'Authorization': `Bearer ${process.env.MONAD_USERNAME_API_KEY}`
            //     })
            }
        });
        
        if (!response.ok) {
            if (response.status === 404) {
                return null; // User doesn't have a username
            }
            throw new Error(`API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("data is ", data)
        if (!data.hasUsername) {
            return null;
        }
        return data.user?.username || null;
    } catch (error) {
        console.error('Error fetching monad username:', error);
        return null;
    }
}

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
        
        // Fetch username from third party service
        const mUsername = await fetchMonadUsername(address);

        // Upsert player with the fetched username
        const player = await prisma.player.upsert({
            where: { address },
            create: {
                address,
                mUsername
            },
            update: {
                mUsername
            },
            select: {
                id: true,
                address: true,
                mUsername: true,
                updatedAt: true
            }
        });
        
        return NextResponse.json({
            success: true,
            message: mUsername ? 'Username updated successfully' : 'No username found for this address',
            data: { 
                player,
                usernameFound: !!mUsername
            }
        });
    } catch (error) {
        console.error('Error upserting player username:', error);
        return NextResponse.json({
            success: false,
            message: "Failed to update username"
        }, { status: 500 });
    }
}