import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { getContractConfig, getPublicClientByChainId, getSignerClientByChainId, HexString } from '@/config';
import { PrismaClient } from '@prisma/client';
import { TxJobData } from "@/services/queue";
import { privateKeyToAccount } from "viem/accounts";

// Redis connection configuration
const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
};

// Initialize Redis client
const redis = new Redis(redisConnection);

// Initialize Prisma client
const prisma = new PrismaClient();

// Temporary single private key for MVP
const TEMP_PRIVATE_KEY: HexString = process.env.RELAYER_PRIVATE_KEY as HexString;

// Simple nonce tracking (we'll improve this later)
let currentNonce: number | null = null;

// Function to get and cache nonce
async function getNonce(address: HexString, chainId: number): Promise<number> {
  if (currentNonce === null) {
    const publicClient = getPublicClientByChainId(chainId);
    currentNonce = await publicClient.getTransactionCount({ address });
  }
  
  // Increment and return
  const nonceToUse = currentNonce;
  currentNonce++;
  return nonceToUse;
}

// Worker to process transaction jobs
const worker = new Worker<TxJobData>('transaction-processing', async job => {
  const { chainId, player, sessionId, playerMoveId } = job.data;

  try {
    const account = privateKeyToAccount(TEMP_PRIVATE_KEY);

    const signerClient = getSignerClientByChainId(chainId);
    const nonce = await getNonce(account.address, chainId);
    const contract = getContractConfig('ScoreManager', chainId);
    // Execute transaction
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const txHash = await signerClient.writeContract({
      address: contract.address,
      abi: contract.abi,
      account,
      functionName: "storeScore",
      args: [player, BigInt(sessionId)],
      nonce,
    });
    // await new Promise(resolve => setTimeout(resolve, 5000));
    // Update player move with transaction hash
    await prisma.playerMove.update({
      where: { id: playerMoveId },
      data: { txHash },
    });

    return txHash;
  } catch (error) {
    console.error('Transaction processing failed:', error);
    throw error; // This will trigger the job retry mechanism
  }
}, {
  connection: redisConnection,
});

// Handle worker events
worker.on('completed', job => {
  console.log(`Job ${job.id} completed. Transaction hash: ${job.returnvalue}`);
});

worker.on('failed', (job, error) => {
  console.error(`Job ${job?.id} failed:`, error);
});
