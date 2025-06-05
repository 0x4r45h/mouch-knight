'use client'
import {useEffect, useState, useCallback} from "react";
import {getContractConfig, SingleContractConfig} from "@/config";
import {useAccount} from "wagmi";
import { useReadScoreTokenBalanceOf} from "@/generated";

export function useContractConfig(contractName: string, chainId: number | undefined) {
    const [contract, setContract] = useState<SingleContractConfig | null>(null);
    const [error, setError] = useState<string | null>(null);
    useEffect(() => {
        console.log(`useEffect inside useContractConfig called with ${contractName} and ${chainId}`)

        if (chainId) {
            try {
                const config = getContractConfig(contractName, chainId);
                setContract(config);
                setError(null); // Clear any previous errors
            } catch (err) {
                setContract(null);
                setError(`Error: ${err}`);
            }
        } else {
            setContract(null);
            setError("Invalid chain ID");
        }
    }, [chainId, contractName]);

    return { contract, error };
}

export function useScoreTokenBalanceOfPlayer() {
    const {chain, address} = useAccount()
    const {contract: scoreTokenConfig} = useContractConfig('ScoreToken', chain?.id)
    return  useReadScoreTokenBalanceOf({
        address: scoreTokenConfig?.address,
        args: [address ? address : '0x'],
        query: {
            enabled: !!address
        }
    });
}
export function useGetPlayerHighscore() {
    const {chain, address} = useAccount();
    const [highscore, setHighscore] = useState<number>(0);
    const [error, setError] = useState<Error | null>(null);
    const [loading, setLoading] = useState(false);
    const [lastManualUpdate, setLastManualUpdate] = useState<number | null>(null);
    
    // Expiry time in milliseconds (5 minutes)
    const MANUAL_UPDATE_EXPIRY = 5 * 60 * 1000;

    const fetchHighscore = useCallback(async (force = false) => {
        if (!address || !chain?.id) return;
        
        // Skip fetch if we recently manually updated the highscore and not forcing
        const now = Date.now();
        if (!force && lastManualUpdate && (now - lastManualUpdate < MANUAL_UPDATE_EXPIRY)) {
            console.log('Skipping fetch due to recent manual update');
            return;
        }
        
        setLoading(true);
        try {
            const response = await fetch(`/api/game/score/highscore/player?chain_id=${chain.id}&player=${address}`);
            if (!response.ok) {
                throw new Error('Failed to fetch highscore');
            }
            
            const data = await response.json();
            const score = data.data.highscore;
            setHighscore(score ? Number(score) : 0);
            setError(null);
            console.log('Fetched highscore from backend:', score);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Unknown error'));
            console.error('Error fetching highscore:', err);
        } finally {
            setLoading(false);
        }
    }, [MANUAL_UPDATE_EXPIRY, address, chain, lastManualUpdate]);

    // Custom setter that also sets the last update timestamp
    const setHighscoreWithTimestamp = useCallback((score: number) => {
        setHighscore(score);
        setLastManualUpdate(Date.now());
    }, []);

    useEffect(() => {
        fetchHighscore();
    }, [fetchHighscore]);

    return {
        data: highscore,
        refetch: fetchHighscore,
        error,
        isLoading: loading,
        setHighscore: setHighscoreWithTimestamp // Expose the setter with timestamp
    };
}