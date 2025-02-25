import {getContractConfig, getPublicClientByChainId} from "@/config";
import {anvil} from "@reown/appkit/networks";

// Configure the client
const client = getPublicClientByChainId(anvil.id)

// Start and Step Block
const STEP = BigInt(1000);
// In-memory store for high scores
export const highScores = new Map<string, bigint>();
async function listenForHighScores() {
    const contractConfig = getContractConfig('ScoreManager', anvil.id);
    let currentBlock = contractConfig.deployedBlock;

    while (true) {
        try {
            const latestBlock = await client.getBlockNumber();
            if (currentBlock >= latestBlock) {
                console.log(`current start block is ${currentBlock} and latest block is ${latestBlock}`)
                await new Promise(resolve => setTimeout(resolve, 10000)); // Wait for 10s
                continue;
            }
            const endBlock = currentBlock + BigInt(STEP) < latestBlock ? currentBlock + BigInt(STEP) : latestBlock;

            console.log(`Fetching events from ${currentBlock} to ${endBlock}`);
            // Fetch events
            const logs = await client.getLogs({
                fromBlock: currentBlock,
                toBlock: endBlock,
                address: contractConfig.address,
                strict: true,
                event:  {
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

            logs.forEach(log => {
                const playerAddress = log.args.player;
                const score = log.args.score;
                const session = log.args.session;
                console.log(`Player: ${playerAddress}, Score: ${score} on session ${session}`);

                highScores.set(playerAddress, score);
                // Store or update high score
                const previousScore = highScores.get(playerAddress) || 0;
                if (score > previousScore) {
                    highScores.set(playerAddress, score);
                }
            });

            currentBlock = endBlock + BigInt(1);
        } catch (error) {
            console.error('Error fetching events:', error);
            await new Promise(resolve => setTimeout(resolve, 10000)); // Wait for 10s before retrying
        }
    }
}

// Start the loop once when the server starts
// Register the listener only once
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
if (typeof window === 'undefined' && !globalThis.isHighScoreListenerRunning) {
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
    globalThis.isHighScoreListenerRunning = true;
    listenForHighScores();
}
