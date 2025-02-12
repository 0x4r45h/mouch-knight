'use client'

import React, {useState} from "react";
import {contractAddresses} from "@/config";
import { useWriteDelegatedMessageStorageDeposit} from "@/generated";
import {parseEther} from "viem";
import { useWaitForTransactionReceipt } from 'wagmi'

export const DepositToken = () => {
    const [amount, setAmount] = useState('');
    const { data: hash, writeContract, isPending } = useWriteDelegatedMessageStorageDeposit()
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log(`amount is ${amount}`);
        writeContract({
            address: contractAddresses.DelegatedMessageStorage,
            value: parseEther(amount)
        })
    }

   const { isLoading: isConfirming, isSuccess: isConfirmed} = useWaitForTransactionReceipt({ hash })

    return (
        <form onSubmit={handleSubmit}>
            <input name="amount" placeholder="0.1" required value={amount} onChange={(e) => setAmount(e.target.value)} />
            <button type="submit" disabled={isPending}>{isPending ? 'Depositing...' : 'Deposit'}</button>
            {hash && <div>Transaction Hash : {hash}</div>}
            {isConfirming && <div>Waiting for confirmation...</div>}
            {isConfirmed && <div>Transaction confirmed.</div>}
        </form>
    )
}