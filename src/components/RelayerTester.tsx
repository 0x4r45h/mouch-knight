'use client'

import React, {useState} from "react";
import {useAccount} from "wagmi";

export const RelayerTester = () => {
    const [amount, setAmount] = useState('');
    const [toAddr, setToAddr] = useState('');
    const account = useAccount()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            const response = await fetch('/api/relayer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: account.address,
                    amount: amount
                })
            })
            if (!response.ok) {
                console.error('Network response was not ok', response)
            }
            const result = await response.json();
            console.log('Result is ', result)

        } catch (error) {
            console.error('Error during deposit:', error);
        }

    }
    return (
        <form onSubmit={handleSubmit}>
            <input name="to" placeholder="0xabc" required value={toAddr} onChange={(e) => setToAddr(e.target.value)}/>
            <input name="amount" placeholder="0.1" required value={amount} onChange={(e) => setAmount(e.target.value)}/>
            <button type="submit">Relay</button>
        </form>
    )
}