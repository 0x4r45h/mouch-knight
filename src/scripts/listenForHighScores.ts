import { getContractConfig, getPublicClientByChainId } from "@/config";
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const STEP = BigInt(100);

async function listenForHighScores(chainId: number) {
    // Configure the client
    const client = getPublicClientByChainId(chainId);
    const contractConfig = getContractConfig('ScoreManager', chainId);
    let currentBlock = contractConfig.deployedBlock;

    while (true) {
        try {
            const latestBlock = await client.getBlockNumber();
            if (currentBlock >= latestBlock) {
                console.log(`chain '${chainId}' - current start block is ${currentBlock} and latest block is ${latestBlock}`);
                await new Promise(resolve => setTimeout(resolve, 10000)); // Wait for 10s
                continue;
            }
            const endBlock = currentBlock + BigInt(STEP) < latestBlock ? currentBlock + BigInt(STEP) : latestBlock;

            console.log(`chain '${chainId}' - Fetching events from ${currentBlock} to ${endBlock}`);
            // Fetch events
            const logs = await client.getLogs({
                fromBlock: currentBlock,
                toBlock: endBlock,
                address: contractConfig.address,
                strict: true,
                event: {
                    type: 'event',
                    anonymous: false,
                    inputs: [
                        {
                            name: 'player',
                            internalType: 'address',
                            type: 'address',
                            indexed: true,
                        },
                        {
                            name: 'session',
                            internalType: 'uint256',
                            type: 'uint256',
                            indexed: false,
                        },
                        {
                            name: 'score',
                            internalType: 'uint256',
                            type: 'uint256',
                            indexed: false,
                        },
                    ],
                    name: 'HighScoreUpdated',
                }
            });

            for (const log of logs) {
                const playerAddress = log.args.player;
                const score = log.args.score;
                const sessionId = log.args.session;
                console.log(`chain '${chainId}' - Player: ${playerAddress}, Score: ${score} on session ${sessionId}`);

                // Store in database using Prisma
                const existingScore = await prisma.highScore.findUnique({
                    where: {
                        chainId_playerAddress: {
                            chainId,
                            playerAddress
                        }
                    }
                });

                // Only update if the new score is higher or no record exists
                if (!existingScore || existingScore.score < score) {
                    await prisma.highScore.upsert({
                        where: {
                            chainId_playerAddress: {
                                chainId,
                                playerAddress
                            }
                        },
                        update: {
                            score,
                            sessionId,
                            updatedAt: new Date()
                        },
                        create: {
                            chainId,
                            playerAddress,
                            score,
                            sessionId
                        }
                    });
                }
            }

            currentBlock = endBlock + BigInt(1);

            // Wait to prevent rate-limiting
            const waitTime = chainId === 31337 ? 0 : 3000; // 31337 is anvil.id
            await new Promise(resolve => setTimeout(resolve, waitTime));
        } catch (error) {
            console.error(`chain '${chainId}' - Error fetching events:`, error);
            await new Promise(resolve => setTimeout(resolve, 10000)); // Wait for 10s before retrying
        }
    }
}

// Add a main function to run the script
export default async function main() {
    console.log(process.env.NEXT_PUBLIC_PROJECT_ID); // Test if it loads correctly

    try {
        // You can run multiple chains in parallel if needed
        // For example: Promise.all([listenForHighScores(31337), listenForHighScores(1)])

        // For now, let's just run for one chain - you can change this to the chain ID you need
        const chainId = 31337; // anvil.id - change this to the chain you want to monitor
        console.log(`Starting high score listener for chain ${chainId}...`);
        await listenForHighScores(chainId);
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}

// // Execute the main function
// main().catch(console.error);
