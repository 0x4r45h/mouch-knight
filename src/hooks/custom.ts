'use client'
import {useEffect, useState} from "react";
import {getContractConfig, SingleContractConfig} from "@/config";
import {useAccount} from "wagmi";
import {useReadScoreManagerGetPlayerHighscore, useReadScoreTokenBalanceOf} from "@/generated";

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
    const {chain, address} = useAccount()
    const {contract: scoreManagerConfig} = useContractConfig('ScoreManager', chain?.id)
    return  useReadScoreManagerGetPlayerHighscore({
        address: scoreManagerConfig?.address,
        args: [address ?? '0x'],
        query: {
            enabled: !!address
        }
    });
}