import { http } from 'wagmi'
import { anvil, monadTestnet } from 'viem/chains'
import {createConfig} from '@privy-io/wagmi';
import type {PrivyClientConfig} from '@privy-io/react-auth';

export const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID

if (!privyAppId) {
  throw new Error('Privy App ID is not defined')
}

export function defaultNetwork() {
  return monadTestnet
}
export function supportedChains() {
  return process.env.NODE_ENV !== 'production' ? [monadTestnet, anvil] : [monadTestnet]
}

export const privyWagmiConfig = createConfig({
  chains: process.env.NODE_ENV !== 'production' ? [monadTestnet, anvil] : [monadTestnet],
  transports: {
    [monadTestnet.id]: http(process.env.NEXT_PUBLIC_MONAD_TESTNET_RPC_URL),
    [anvil.id]: http('http://127.0.0.1:8545'),
  },
})


// Replace this with your Privy config
export const privyConfig: PrivyClientConfig = {
  defaultChain: defaultNetwork(),
  supportedChains: supportedChains(),
  embeddedWallets: {
    createOnLogin: 'users-without-wallets',
    requireUserPasswordOnCreate: false,
    showWalletUIs: true
  },
  loginMethods: ['wallet', 'email', 'sms'],
  appearance: {
    showWalletLoginFirst: true,
    walletChainType: 'ethereum-only'
  }
};