import { getContractConfig, getPublicClientByChainId, HexString } from "@/config";

/**
 * Fetches the next session ID for a player from the contract
 * @param playerAddress The player's wallet address
 * @param chainId The blockchain network chain ID
 * @returns The session ID as a string
 */
export async function fetchPlayerSessionId(playerAddress: HexString, chainId: number): Promise<string> {
    const { abi, address } = getContractConfig('ScoreManager', chainId);

    const pubClient = getPublicClientByChainId(chainId);

    const sessionId = await pubClient.readContract({
        address,
        abi,
        functionName: "getPlayerNextSession",
        args: [playerAddress]
    });
    return (sessionId as string).toString();
}

/**
 * Starts a new game session by fetching a session ID from the contract and registering it with the backend
 * @param playerAddress The player's wallet address
 * @param chainId The blockchain network chain ID
 * @returns The response from the backend including the session ID
 */
export async function startNewGameSession(playerAddress: HexString, chainId: number) {
    // First, fetch the session ID from the contract
    const sessionId = await fetchPlayerSessionId(playerAddress, chainId);

    // Then, send it to the backend along with the player address
    const response = await fetch('/api/game', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: playerAddress,
            session_id: sessionId,
            chain_id: chainId
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to register game session');
    }

    return await response.json();
}