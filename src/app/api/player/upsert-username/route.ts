import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/db/client";

// Third party service endpoint - replace with actual endpoint
const THIRD_PARTY_USERNAME_API = process.env.MONAD_USERNAME_API_URL || 'https://api.example.com/username';

async function fetchMonadUsername(address: string): Promise<string | null> {
    // TODO : for now just return a random username
    return `foo${Math.random().toString(36).substring(7)}`;
    try {
        const response = await fetch(`${THIRD_PARTY_USERNAME_API}/${address}`, {
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
        return data.username || null;
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