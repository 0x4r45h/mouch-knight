import {getContractConfig, getPublicClientByChainId} from "@/config";
import {anvil} from "@reown/appkit/networks";

// Start and Step Block
const STEP = BigInt(100);
// In-memory store for high scores
export const highScores = new Map<number, Map<string, bigint>>();

async function listenForHighScores(chainId : number) {
    // Configure the client
    const client = getPublicClientByChainId(chainId)
    const contractConfig = getContractConfig('ScoreManager', chainId);
    let currentBlock = contractConfig.deployedBlock;

    while (true) {
        try {
            const latestBlock = await client.getBlockNumber();
            if (currentBlock >= latestBlock) {
                console.log(`chain '${chainId}' - current start block is ${currentBlock} and latest block is ${latestBlock}`)
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
                console.log(`chain '${chainId}' - Player: ${playerAddress}, Score: ${score} on session ${session} `);
                let chainScore = highScores.get(chainId);
                if (chainScore == undefined) {
                    highScores.set(chainId,new Map<string, bigint>());
                    chainScore = highScores.get(chainId);
                }
                chainScore?.set(playerAddress, score);
            });

            currentBlock = endBlock + BigInt(1);
            await new Promise(resolve => setTimeout(resolve, chainId == anvil.id ? 0 : 3000)); // Wait for 3s before proceeding to prevent rate-limit
        } catch (error) {
            console.error(`chain '${chainId}' - Error fetching events:`, error);
            await new Promise(resolve => setTimeout(resolve, 10000)); // Wait for 10s before retrying
        }
    }
}

// Start the loop once when the server starts
// Register the listener only once
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
if (typeof window === 'undefined' && !globalThis.isHighScoreListenerRunning) {
    // THE CODE INS THIS BLOCK IS RUN ONLY ONCE, SO THE CHANGES WONT BE REFLECTED AFTER HOT-RELOAD
    const backendChainIds = (process.env.NEXT_BACKEND_CHAIN_IDS || '')
        .split(',')
        .map(id => id.trim())  // Remove any extra spaces
        .filter(id => id)      // Filter out empty strings
        .map(id => Number(id));
    console.log('backend chains', backendChainIds);
    backendChainIds.forEach(id => listenForHighScores(id))
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
    globalThis.isHighScoreListenerRunning = true;
}
