'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import React, { type ReactNode } from 'react'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'
import {getReownAppId, defaultNetwork, supportedChains} from "@/config/reown";
import {cookieStorage, createStorage} from 'wagmi'
import {WagmiAdapter} from "@reown/appkit-adapter-wagmi";
import {farcasterFrame as miniAppConnector} from "@farcaster/frame-wagmi-connector";


const queryClient = new QueryClient()

const metadata = {
  name: 'Mouch Knight',
  description: 'Mouch Knight is an arcade game for Monad Blockchain',
  url: 'https://mouch-knight.emberstake.xyz',
  icons: ['https://emberstake.xyz/logo.png']
}

//Set up the Wagmi Adapter (Config)
const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  projectId: getReownAppId(),
  networks: supportedChains(),
  connectors: [
    miniAppConnector(),
  ]
})

export const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId: getReownAppId(),
  networks: supportedChains(),
  defaultNetwork: defaultNetwork(),
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