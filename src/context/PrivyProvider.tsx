'use client'

import React, { type ReactNode } from 'react'
import { PrivyProvider } from '@privy-io/react-auth'
import { WagmiProvider } from '@privy-io/wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {privyAppId, privyClientId, privyConfig, privyWagmiConfig} from '@/config/privy'

const queryClient = new QueryClient()

interface PrivyWalletProviderProps {
  children: ReactNode
}

export default function PrivyWalletProvider({ children }: PrivyWalletProviderProps) {
  return (
    <PrivyProvider appId={privyAppId!} clientId={privyClientId} config={privyConfig}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={privyWagmiConfig}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  )
}