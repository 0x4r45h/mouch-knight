'use client'

import React, {useState} from "react";
import {contractAddresses} from "@/config";
import {useWriteDelegatedMessageStorageDeposit, useWriteDelegatedMessageStorageSetDelegation} from "@/generated";
import {parseEther} from "viem";
import { useWaitForTransactionReceipt, useAccount, useSignMessage } from 'wagmi'


    const handleSignMessage = async () => {
        const {address} = useAccount();
        const {signMessage} = useSignMessage();
        try {
            const message = ethers.utils.solidityKeccak256(
                ['string', 'address', 'uint256'],
                ['Delegate message submission to game server', '0xYourContractAddress', 3600]
            );

            const signature = await signMessage({message});
            console.log('Signature:', signature);
        } catch (error) {
            console.error('Error signing message:', error);
        }
    }

export const SetDelegation = () => {
    const { data: hash, writeContract, isPending } = useWriteDelegatedMessageStorageSetDelegation()
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const validityDuration = BigInt(600000)
        writeContract({
            address: contractAddresses.DelegatedMessageStorage,
            args: [validityDuration, "0xabc"],
        })
    }

   const { isLoading: isConfirming, isSuccess: isConfirmed} = useWaitForTransactionReceipt({ hash })

    return (
        <form onSubmit={handleSubmit}>
            <button type="submit" disabled={isPending}>{isPending ? 'Waiting...' : 'Delegate'}</button>
            {hash && <div>Transaction Hash : {hash}</div>}
            {isConfirming && <div>Waiting for confirmation...</div>}
            {isConfirmed && <div>Transaction confirmed.</div>}
        </form>
    )
}