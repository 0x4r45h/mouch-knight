'use client'

import {wagmiAdapter, projectId, networks, monadTestnet} from '@/config'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import React, { type ReactNode } from 'react'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'

// Set up queryClient
const queryClient = new QueryClient()

if (!projectId) {
  throw new Error('Project ID is not defined')
}

// Set up metadata
const metadata = {
  name: 'Mouch Knight',
  description: 'Mouch Knight is an arcade game for Monad Blockchain',
  url: 'https://mouch-knight.emberstake.xyz', // origin must match your domain & subdomain
  icons: ['https://emberstake.xyz/logo.png']
}

// Create the modal
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks,
  defaultNetwork: monadTestnet,
  metadata,
  themeMode: 'light',
  features: {
    analytics: true,
    swaps: false,
    onramp: false,
    socials: false,
    email: false,
    history: false,
    send: false,
  }
})

function ContextProvider({ children, cookies }: { children: ReactNode; cookies: string | null }) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}

export default ContextProvider
