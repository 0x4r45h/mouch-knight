'use client'

import { monadTestnet} from '@/config'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import React, { type ReactNode } from 'react'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'
import {wagmiAdapter, networks , getReownAppId} from "@/config/reown";

const queryClient = new QueryClient()

const metadata = {
  name: 'Mouch Knight',
  description: 'Mouch Knight is an arcade game for Monad Blockchain',
  url: 'https://mouch-knight.emberstake.xyz',
  icons: ['https://emberstake.xyz/logo.png']
}

export const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId: getReownAppId(),
  networks,
  defaultNetwork: monadTestnet,
  metadata,
  themeMode: 'light',
  themeVariables: {
    '--w3m-accent': '#A0055D',
    '--w3m-color-mix': '#836EF9',
    '--w3m-color-mix-strength': 40,
    '--w3m-border-radius-master': '1px',
  },
  features: {
    collapseWallets: false,
    analytics: true,
    swaps: false,
    onramp: false,
    socials: false,
    email: false,
    history: false,
    send: false,
  }
})

interface ReownProviderProps {
  children: ReactNode
  cookies?: string | null
}

export default function ReownProvider({ children, cookies }: ReownProviderProps) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}