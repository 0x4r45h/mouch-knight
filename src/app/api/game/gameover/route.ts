import {NextRequest, NextResponse} from "next/server";
import {addTxJob} from "@/services/queue";
import prisma from "@/db/client";

export async function POST(request: NextRequest): Promise<NextResponse> {
    const body = await request.json();
    const player = body.player;
    const chainId = Number(body.chain_id);
    const sessionId =  Number(body.session_id); // Add this to the request body

    try {
        // Get player record
        const playerRecord = await prisma.player.findUnique({
            where: { address: player }
        });

        if (!playerRecord) {
            return NextResponse.json({ 
                success: false, 
                message: "Player not found" 
            }, { status: 404 });
        }

        // Check for replay attack
        const existingRecord = await prisma.gameOverRecord.findUnique({
            where: {
                playerId_chainId_sessionId: {
                    playerId: playerRecord.id,
                    chainId,
                    sessionId
                }
            }
        });

        if (existingRecord) {
            return NextResponse.json({ 
                success: false, 
                message: "Game over already processed for this session" 
            }, { status: 409 });
        }

        // a.1. Get current session score (most recent move)
        const currentSessionMove = await prisma.playerMove.findFirst({
            where: {
                playerId: playerRecord.id,
                chainId,
                sessionId
            },
            orderBy: { createdAt: 'desc' }
        });

        if (!currentSessionMove) {
            return NextResponse.json({ 
                success: false, 
                message: "No moves found for this session" 
            }, { status: 404 });
        }

        const sessionScore = currentSessionMove.score;

        // a.2. Get player's highest score across all sessions
        const highestScoreMove = await prisma.playerMove.findFirst({
            where: {
                playerId: playerRecord.id,
                chainId,
                // get high score except the current session
                sessionId: {
                    not: sessionId
                }
            },
            orderBy: { score: 'desc' }
        });

        const previousHighScore = highestScoreMove?.score || 0;
        const isNewHighScore = sessionScore > previousHighScore;
        // b.1. Count moves in current session
        const moveCount = await prisma.playerMove.count({
            where: {
                playerId: playerRecord.id,
                chainId,
                sessionId
            }
        });

        // Create game over record to prevent replay
        const gameOverRecord = await prisma.gameOverRecord.create({
            data: {
                playerId: playerRecord.id,
                chainId,
                sessionId
            }
        });

        const jobIds: string[] = [];

        // Dispatch UpdateHighscoreTx job if new high score
        if (isNewHighScore) {
            const highScoreJobId = await addTxJob({
                chainId,
                player: player,
                sessionId,
                payload: {
                    type: 'UpdateHighscoreTx',
                    playerId : playerRecord.id,
                },
                type: "TxJobData"
            }, {
                delay: 5000 // 5 seconds delay
            });
            jobIds.push(highScoreJobId);
            console.log(`UpdateHighscoreTx Job ID: ${highScoreJobId}`);
        }

        // b.1. Always dispatch SendUserScoreJob
        const sendScoreJobId = await addTxJob({
            type: "SendUserScoreJobData",
            chainId,
            sessionId,
            playerId : playerRecord.id,
            playerAddress: player,
            scoreAmount: sessionScore,
            transactionAmount: moveCount
        }, {
            delay: 0
        });
        jobIds.push(sendScoreJobId);
        console.log(`SendUserScoreJob ID: ${sendScoreJobId}`);

        return NextResponse.json({ 
            message: 'Game over jobs submitted', 
            data: { 
                jobIds,
                sessionScore,
                isNewHighScore,
                moveCount,
                gameOverRecordId: gameOverRecord.id
            } 
        });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ 
            success: false, 
            message: "Game over processing failed", 
            data: { error: e } 
        }, { status: 500 });
    }
}