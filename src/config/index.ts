import {scoreManagerAbi, scoreTokenAbi, itemPurchaseManagerAbi, leaderboardAbi} from "@/generated";
import {Abi, createPublicClient, createWalletClient, http, WalletClient } from "viem";
import { anvil, monadTestnet } from 'viem/chains'

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL
export const MINI_APP_URL = process.env.NEXT_PUBLIC_MINI_APP_URL
export const WALLET_PROVIDER = process.env.NEXT_PUBLIC_WALLET_PROVIDER
export const MONAD_USERNAME_API = process.env.MONAD_USERNAME_API_URL;
export const MONAD_USERNAME_REGISTER_URL = process.env.NEXT_PUBLIC_MONAD_USERNAME_REGISTER_URL;


if (!APP_URL) {
  throw new Error('APP_URL is not defined')
}
export type HexString = `0x${string}`

const contractsConfig = {
  ScoreManager: {
    abi: scoreManagerAbi,
    addresses: {
      [anvil.id]: process.env.NEXT_PUBLIC_CONTRACT_ADDR__ANVIL__SCORE_MANAGER as HexString,
      [monadTestnet.id]: process.env.NEXT_PUBLIC_CONTRACT_ADDR__MONAD_TESTNET__SCORE_MANAGER as HexString,
    },
    deployedBlock: {
      [anvil.id]: BigInt(1),
      [monadTestnet.id]:  BigInt(process.env.NEXT_PUBLIC_CONTRACT_DEPLOYED_BLOCK__MONAD_TESTNET__SCORE_MANAGER || 1),
    }
  },
  ScoreToken: {
    abi: scoreTokenAbi,
    addresses: {
      [anvil.id]: process.env.NEXT_PUBLIC_CONTRACT_ADDR__ANVIL__SCORE_TOKEN as HexString,
      [monadTestnet.id]: process.env.NEXT_PUBLIC_CONTRACT_ADDR__MONAD_TESTNET__SCORE_TOKEN as HexString,
    },
    deployedBlock: {
      [anvil.id]: BigInt(0),
      [monadTestnet.id]:  BigInt(0),
    }
  },
  ItemPurchaseManager: {
    abi: itemPurchaseManagerAbi,
    addresses: {
      [anvil.id]: process.env.NEXT_PUBLIC_CONTRACT_ADDR__ANVIL__ITEM_PURCHASE_MANAGER as HexString,
      [monadTestnet.id]: process.env.NEXT_PUBLIC_CONTRACT_ADDR__MONAD_TESTNET__ITEM_PURCHASE_MANAGER as HexString,
    },
    deployedBlock: {
      [anvil.id]: BigInt(1),
      [monadTestnet.id]:  BigInt(process.env.NEXT_PUBLIC_CONTRACT_DEPLOYED_BLOCK__MONAD_TESTNET__ITEM_PURCHASE_MANAGER || 1),
    }
  },
  CentralLeaderboard: {
    abi: leaderboardAbi,
    addresses: {
      [anvil.id]: process.env.NEXT_PUBLIC_CONTRACT_ADDR__ANVIL__CENTRAL_LEADERBOARD as HexString,
      [monadTestnet.id]: process.env.NEXT_PUBLIC_CONTRACT_ADDR__MONAD_TESTNET__CENTRAL_LEADERBOARD as HexString,
    },
    deployedBlock: {
      [anvil.id]: BigInt(1),
      [monadTestnet.id]:  BigInt(process.env.NEXT_PUBLIC_CONTRACT_DEPLOYED_BLOCK__MONAD_TESTNET__CENTRAL_LEADERBOARD || 1),
    }
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
    console.error(`Contract ${contractName} not found in config`);
    // throw new Error(`Contract ${contractName} not found in config`);
  }
  const address = contract.addresses[chainId];
  if (!address) {
    console.error(`Contract ${contractName} not deployed on chain ${chainId}`);
    // throw new Error(`Contract ${contractName} not deployed on chain ${chainId}`);
  }
  return {
    address,
    abi: contract.abi,
    deployedBlock: contract.deployedBlock[chainId]
  };
};

function getConfigForChain(chainId: number) {
  switch (chainId) {
    case monadTestnet.id:
      return monadTestnet;
    case anvil.id:
      return anvil;
    default:
      throw new Error(`No client has defined for chain ${chainId}`);
  }
}

const publicClients: Record<number, ReturnType<typeof createPublicClient>> = {};
export const getPublicClientByChainId = (chainId: number): ReturnType<typeof createPublicClient> => {
  // Return cached client if it exists
  if (publicClients[chainId]) {
    return publicClients[chainId];
  }

  const chainConfig = getConfigForChain(chainId);

  let paidRPC = '';
  if (chainId == monadTestnet.id && process.env.NEXT_MONAD_TESTNET_BACKEND_RPC_URL) {
    paidRPC = process.env.NEXT_MONAD_TESTNET_BACKEND_RPC_URL
  }
  
  // Create new client
  const client = createPublicClient({
    chain: chainConfig,
    transport: http(paidRPC, {
      onFetchRequest(request, init) {
        // console.log('request:', request);
        // console.log('init:', init);
      },
      timeout: 30_000,
      retryCount: 3,
      batch: {
        batchSize: 2000,
        wait: 200,
      }
    }),
  });
  
  // Cache the client
  publicClients[chainId] = client;
  
  return client;
}

const signerClients: Record<number, WalletClient> = {};

export const getSignerClientByChainId = (chainId: number): WalletClient => {

  if (signerClients[chainId]) {
    return signerClients[chainId];
  }

  const chainConfig = getConfigForChain(chainId);

  let paidRPC = '';
  if (chainId == monadTestnet.id && process.env.NEXT_MONAD_TESTNET_BACKEND_RPC_URL) {
      paidRPC = process.env.NEXT_MONAD_TESTNET_BACKEND_RPC_URL
  }
  const client = createWalletClient({
    chain: chainConfig,
    transport: http(paidRPC, {
      onFetchRequest(request, init) {
        // console.log('request:', request);
        // console.log('init:', init);
      },
      onFetchResponse(response) {
        // console.log('response:', response);
      },
      timeout: 30_000,
      retryCount: 3,
      batch: {
        batchSize: 2000,
        wait: 500,
      }
    }),
  });
  signerClients[chainId] = client;
  return client;
}
