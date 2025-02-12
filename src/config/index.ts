import { cookieStorage, createStorage, http } from 'wagmi'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, arbitrum, sepolia, anvil } from '@reown/appkit/networks'
import type { AppKitNetwork } from '@reown/appkit/networks'
// export type HexAddress = `0x${string}`;
// Get projectId from https://cloud.reown.com
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID

if (!projectId) {
  throw new Error('Project ID is not defined')
}
export type  HexString = `0x{string}`

export const networks = [mainnet, arbitrum, sepolia, anvil] as [AppKitNetwork, ...AppKitNetwork[]]
//Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  projectId,
  networks,
  transports: {
    [sepolia.id]: http('https://sepolia.drpc.org', {
      batch: {
        wait: 16, // in ms
      }
    }),
  }
})

export const config = wagmiAdapter.wagmiConfig

export const contractAddresses: { [key: string] : `0x${string}`} = {
  DelegatedMessageStorage: '0x5fbdb2315678afecb367f032d93f642f64180aa3',
  ScoreManager: '0xe7f1725e7734ce288f8367e1bb143e90bb3f0512'
}