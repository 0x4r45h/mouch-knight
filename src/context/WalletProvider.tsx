'use client'

import React, {type ReactNode} from 'react'
import {WALLET_PROVIDER} from '@/config'
import ReownProvider from './ReownProvider'
import PrivyWalletProvider from './PrivyProvider'
import RainbowWalletProvider from "@/context/RainbowProvider";

interface WalletProviderProps {
    children: ReactNode
    cookies?: string | null
}

export default function WalletProvider({children, cookies}: WalletProviderProps) {
    if (WALLET_PROVIDER === 'privy') {
        return <PrivyWalletProvider>{children}</PrivyWalletProvider>
    } else if (WALLET_PROVIDER === 'rainbow') {
        return <RainbowWalletProvider>{children}</RainbowWalletProvider>
    } else {
        return <ReownProvider cookies={cookies}>{children}</ReownProvider>
    }

}