import { anvil, monadTestnet } from 'viem/chains'
import {type AppKitNetwork} from "@reown/appkit/networks";



export function supportedChains() {
  const networks = [monadTestnet] as [AppKitNetwork, ...AppKitNetwork[]]

  if (process.env.NODE_ENV !== 'production') {
    networks.push(anvil)
  }
  return networks
}

export function defaultNetwork(): AppKitNetwork {
  return monadTestnet
}

export function getReownAppId() {
  const reownAppId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID

  if (!reownAppId) {
    throw new Error('Reown App ID is not defined')
  }
  return reownAppId
}


