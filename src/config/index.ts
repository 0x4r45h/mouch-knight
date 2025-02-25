import { cookieStorage, createStorage } from 'wagmi'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import {anvil, defineChain} from '@reown/appkit/networks'
import type { AppKitNetwork } from '@reown/appkit/networks'
import {scoreManagerAbi} from "@/generated";
import {Abi, createPublicClient, createWalletClient, http, WalletClient} from "viem";

// Get projectId from https://cloud.reown.com
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID

if (!projectId) {
  throw new Error('Project ID is not defined')
}
export type HexString = `0x${string}`

export const monadDevnet = defineChain({
  id: Number(process.env.NEXT_PUBLIC_MONAD_CHAIN_ID),
  caipNetworkId: 'eip155:123456789',
  chainNamespace: 'eip155',
  name: 'Monad Devnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'DMON',
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_MONAD_RPC_URL || ""],
    },
  },
  blockExplorers: {
    default: { name: 'Monad Devnet Blockscout', url: process.env.NEXT_PUBLIC_MONAD_BLOCKSCOUT_URL || "" },
  },
})

export const networks = [monadDevnet, anvil] as [AppKitNetwork, ...AppKitNetwork[]]
//Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  projectId,
  networks,
})

const contractsConfig = {
  ScoreManager: {
    abi: scoreManagerAbi,
    addresses: {
      [anvil.id]: process.env.NEXT_PUBLIC_CONTRACT_ADDR__ANVIL__SCORE_MANAGER as HexString,
      [monadDevnet.id]: process.env.NEXT_PUBLIC_CONTRACT_ADDR__MONAD_DEVNET__SCORE_MANAGER as HexString,
    },
    deployedBlock: {
      [anvil.id]: BigInt(1),
      [monadDevnet.id]:  BigInt(process.env.NEXT_PUBLIC_CONTRACT_DEPLOYED_BLOCK__MONAD_DEVNET__SCORE_MANAGER || 1),
    }
    //add deployed block per chain
  },
} as const;

type ContractConfig = {
  abi: Abi;
  addresses: Record<number, HexString>; // Maps chain IDs to contract addresses
  deployedBlock: Record<number, bigint>; // Maps chain IDs to contract deployed Block number
};

// Define a type for the contracts configuration object
type ContractsConfig = {
  [contractName: string]: ContractConfig;
};
export type SingleContractConfig = {
  address: HexString,
  abi: Abi
  deployedBlock: bigint,
}
// Export the function to get contract configuration
export const getContractConfig = (contractName: string, chainId: number): SingleContractConfig => {
  const contract = (contractsConfig as ContractsConfig)[contractName];
  if (!contract) {
    throw new Error(`Contract ${contractName} not found in config`);
  }
  const address = contract.addresses[chainId];
  if (!address) {
    throw new Error(`Contract ${contractName} not deployed on chain ${chainId}`);
  }
  return {
    address,
    abi: contract.abi,
    deployedBlock: contract.deployedBlock[chainId]
  };
};

export const getPublicClientByChainId = (chainId: number): ReturnType<typeof createPublicClient> => {
  const chainConfigMap = {
    [monadDevnet.id]: monadDevnet,
    [anvil.id]: anvil,
  };

  const chainConfig = chainConfigMap[chainId];

  if (!chainConfig) {
    throw new Error(`No client has defined for chain ${chainId}`);
  }

  return createPublicClient({
    chain: chainConfig,
    transport: http(),
  });
}
export const getSignerClientByChainId = (chainId: number): WalletClient => {
  const chainConfigMap = {
    [monadDevnet.id]: monadDevnet,
    [anvil.id]: anvil,
  };

  const chainConfig = chainConfigMap[chainId];

  if (!chainConfig) {
    throw new Error(`No client has defined for chain ${chainId}`);
  }

  return createWalletClient({
    chain: chainConfig,
    transport: http(),
  });
}