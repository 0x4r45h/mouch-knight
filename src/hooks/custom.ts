'use client'
import {useEffect, useState} from "react";
import {getContractConfig, SingleContractConfig} from "@/config";

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