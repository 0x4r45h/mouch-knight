import {NextRequest, NextResponse} from "next/server";
import crypto from 'crypto';
import {addTxJob} from "@/services/queue";
import prisma from "@/db/client";

// The same secret key used in the WASM module
const SECRET_KEY = "f3a9b5c7d1e8f2a4b6c8d0e2f4a6b8c0"; // Replace with your own secret key

// Function to verify the hash from the client
function verifyHash(
    playerAddress: string,
    score: number,
    chainId: number,
    sessionId: number,
    timestamp: number,
    clientHash: string
): boolean {
    // Allow a 60sec window for the timestamp to prevent replay attacks
    const currentTime = Math.floor(Date.now() / 1000);
    if (Math.abs(currentTime - timestamp) > 60) {
        console.error("Timestamp is too old or from the future");
        return false;
    }

    // Recreate the hash on the server side
    const payload = `${SECRET_KEY}:${playerAddress}:${score}:${chainId}:${sessionId}:${timestamp}`;
    const serverHash = crypto
        .createHash('sha256')
        .update(payload)
        .digest('hex');

    // Compare the hashes
    return serverHash === clientHash;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    const body = await request.json();
    const player = body.player;
    const sessionId = body.session_id;
    const chainId = body.chain_id;
    const score = body.score;
    const verification = body.verification;

    // Verify the hash
    if (!verification || !verification.hash || !verification.timestamp) {
        return NextResponse.json({ error: "Missing verification data" }, { status: 400 });
    }

    const isValid = verifyHash(
        player,
        score,
        chainId,
        sessionId,
        verification.timestamp,
        verification.hash
    );

    if (!isValid) {
        return NextResponse.json({ error: "Invalid verification hash" }, { status: 403 });
    }

    // Check if verification hash already exists
    const existingMove = await prisma.playerMove.findUnique({
        where: {
            verificationHash: verification.hash
        }
    });

    if (existingMove) {
        return NextResponse.json({ error: "Duplicate move detected" }, { status: 409 });
    }

    // Get or create player
    let playerRecord = await prisma.player.findUnique({
        where: {
            address: player
        }
    });

    if (!playerRecord) {
        playerRecord = await prisma.player.create({
            data: {
                address: player
            }
        });
    }
    // Store the player move
    const playerMove = await prisma.playerMove.create({
        data: {
            playerId: playerRecord.id,
            chainId,
            score,
            sessionId: Number(sessionId),
            verificationHash: verification.hash
        }
    });
    const jobId= await addTxJob({
        chainId,
        player: player,
        payload: {
            type: 'PlayerMoveTx',
            sessionId,
            playerMoveId: playerMove.id,
        },
        type: "TxJobData"
    });
    console.log(`Job ID is ${jobId}`);

    try {
        return NextResponse.json({ message: 'Score Submitted', data: { txHash: '0x', moveId: playerMove.id } });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ success: false, message: "Tx Failed", data: { error: e } }, { status: 500 });
    }
}