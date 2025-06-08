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

export function usePlayerCooldown() {
    const {chain, address} = useAccount();
    const [cooldownData, setCooldownData] = useState<{
        inCooldown: boolean;
        remainingSeconds: number;
        cooldownEnds: string | null;
    }>({
        inCooldown: false,
        remainingSeconds: 0,
        cooldownEnds: null
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    
    const checkCooldown = useCallback(async () => {
        if (!address || !chain?.id) return;
        
        setLoading(true);
        try {
            const response = await fetch(`/api/game/cooldown?chain_id=${chain.id}&player=${address}`);
            const data = await response.json();
            
            if (data.data.cooldown) {
                setCooldownData({
                    inCooldown: true,
                    remainingSeconds: data.data.remainingSeconds,
                    cooldownEnds: data.data.cooldownEnds
                });
            } else {
                setCooldownData({
                    inCooldown: false,
                    remainingSeconds: 0,
                    cooldownEnds: null
                });
            }
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Unknown error'));
            console.error('Error checking cooldown:', err);
        } finally {
            setLoading(false);
        }
    }, [address, chain]);
    
    useEffect(() => {
        checkCooldown();
        
        // Set up interval to update remaining time
        let interval: NodeJS.Timeout | null = null;
        if (cooldownData.inCooldown && cooldownData.cooldownEnds) {
            interval = setInterval(() => {
                const now = new Date();
                const ends = new Date(cooldownData.cooldownEnds!);
                const remaining = Math.max(0, Math.ceil((ends.getTime() - now.getTime()) / 1000));
                
                if (remaining <= 0) {
                    setCooldownData({
                        inCooldown: false,
                        remainingSeconds: 0,
                        cooldownEnds: null
                    });
                    if (interval) clearInterval(interval);
                } else {
                    setCooldownData(prev => ({
                        ...prev,
                        remainingSeconds: remaining
                    }));
                }
            }, 1000);
        }
        
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [checkCooldown, cooldownData.cooldownEnds, cooldownData.inCooldown]);
    
    return {
        inCooldown: cooldownData.inCooldown,
        remainingSeconds: cooldownData.remainingSeconds,
        cooldownEnds: cooldownData.cooldownEnds,
        checkCooldown,
        isLoading: loading,
        error
    };
}

export function useTreasuryBalance(chainId?: number) {
    const [balance, setBalance] = useState<{
        initialBalance: bigint;
        totalNativePurchases: bigint;
        totalBalance: bigint;
    } | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchTreasuryBalance = useCallback(async () => {
        if (!chainId) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const response = await fetch(`/api/game/treasury?chain_id=${chainId}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch treasury balance');
            }
            
            const result = await response.json();
            
            if (result.success) {
                setBalance(result.data);
            } else {
                throw new Error(result.message || 'Unknown error');
            }
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
        } finally {
            setLoading(false);
        }
    }, [chainId]);

    useEffect(() => {
        fetchTreasuryBalance();
    }, [fetchTreasuryBalance]);

    return {
        balance,
        error,
        loading,
        refetch: fetchTreasuryBalance
    };
}
