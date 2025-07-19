import { createConfig, http } from 'wagmi'
import { monadTestnet } from './index'
import { anvil } from 'viem/chains'

export const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID

if (!privyAppId) {
  throw new Error('Privy App ID is not defined')
}

export const privyWagmiConfig = createConfig({
  chains: process.env.NODE_ENV !== 'production' ? [monadTestnet, anvil] : [monadTestnet],
  transports: {
    [monadTestnet.id]: http(process.env.NEXT_PUBLIC_MONAD_TESTNET_RPC_URL),
    [anvil.id]: http('http://127.0.0.1:8545'),
  },
})