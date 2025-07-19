'use client'

import React, { type ReactNode } from 'react'
import { WALLET_PROVIDER } from '@/config'
import ReownProvider from './ReownProvider'
import PrivyWalletProvider from './PrivyProvider'

interface WalletProviderProps {
  children: ReactNode
  cookies?: string | null
}

export default function WalletProvider({ children, cookies }: WalletProviderProps) {
  if (WALLET_PROVIDER === 'privy') {
    return <PrivyWalletProvider>{children}</PrivyWalletProvider>
  }
  
  return <ReownProvider cookies={cookies}>{children}</ReownProvider>
}