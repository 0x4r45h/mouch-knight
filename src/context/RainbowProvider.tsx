'use client'

import React, {type ReactNode} from 'react'
import {RainbowKitProvider} from '@rainbow-me/rainbowkit';

import {WagmiProvider} from 'wagmi';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {rainbowWagmiConfig} from "@/config/rainbow";

const queryClient = new QueryClient()

interface WalletProviderProps {
    children: ReactNode
}

export default function RainbowWalletProvider({children}: WalletProviderProps) {
    return (
        <WagmiProvider config={rainbowWagmiConfig}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider>
                    {children}
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>

    )
}
