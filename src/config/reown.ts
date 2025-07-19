import {cookieStorage, createStorage} from 'wagmi'
import {monadTestnet} from './index'
import { anvil } from 'viem/chains'
import {type AppKitNetwork} from "@reown/appkit/networks";
import {WagmiAdapter} from "@reown/appkit-adapter-wagmi";
import {farcasterFrame as miniAppConnector} from "@farcaster/frame-wagmi-connector";

export function getReownAppId() {
  const reownAppId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID

  if (!reownAppId) {
    throw new Error('Reown App ID is not defined')
  }
  return reownAppId
}


export const networks = [monadTestnet] as [AppKitNetwork, ...AppKitNetwork[]]

if (process.env.NODE_ENV !== 'production') {
  networks.push(anvil)
}

//Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  projectId: getReownAppId(),
  networks,
  connectors: [
    miniAppConnector(),
  ]
})

