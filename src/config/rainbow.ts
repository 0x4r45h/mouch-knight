import {http, createConfig} from 'wagmi'
import {anvil, monadTestnet} from 'viem/chains'
import {connectorsForWallets} from '@rainbow-me/rainbowkit';
import {toPrivyWallet} from '@privy-io/cross-app-connect/rainbow-kit';
import {
    rabbyWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { privyProviderId} from "@/config/privy";


if (!privyProviderId) {
  throw new Error('Privy Provider ID is not defined')
}

export function defaultNetwork() {
    return monadTestnet
}

export function supportedChains() {
    return process.env.NODE_ENV !== 'production' ? [monadTestnet, anvil] : [monadTestnet]
}


const connectors = connectorsForWallets(
    [
        {
            groupName: 'Monad Wallet',
            wallets: [
                toPrivyWallet({
                    id: privyProviderId,
                    name: 'Monad ID',
                    iconUrl: 'https://cdn.prod.website-files.com/667c57e6f9254a4b6d914440/66c3711574e166ac115bba8a_Logo%20Mark.svg'
                }),
            ],
        },
        ...(process.env.NODE_ENV !== 'production'
            ? [{
                groupName: 'Dev',
                wallets: [rabbyWallet]
            }]
            : []),
    ],
    {
        appName: 'Mouch Knight',
        projectId: 'Demo',
    }
);

export const rainbowWagmiConfig = createConfig({
    chains: process.env.NODE_ENV !== 'production' ? [monadTestnet, anvil] : [monadTestnet],
    ssr: false,
    multiInjectedProviderDiscovery: false, // This will prevent the rainbow kit from showing installed wallets on the list
    transports: {
        [monadTestnet.id]: http(process.env.NEXT_PUBLIC_MONAD_TESTNET_RPC_URL),
        [anvil.id]: http('http://127.0.0.1:8545'),
    },
    connectors,
})
