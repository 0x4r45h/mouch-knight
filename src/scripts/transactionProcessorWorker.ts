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

// Redis sorted set for round-robin relayer keys
const RELAYER_KEYS_SET = 'relayer_keys';

// Function to get and cache nonce


async function getNonce(address: HexString, chainId: number): Promise<number> {
  const nonceKey = `${chainId}:${address}:nonce`;
  const lockKey = `${nonceKey}:lock`;
  const lockTimeout = 5000; // 5 seconds lock timeout
  const retryDelay = 100; // 100ms between retries
  const maxRetries = 50; // Maximum number of retries (5 seconds total)

  // Try to get the nonce from Redis first (fast path)
  const redisNonce = await redis.get(nonceKey);
  if (redisNonce !== null) {
    // Increment the nonce optimistically
    const currentNonce = parseInt(redisNonce, 10);
    await redis.set(nonceKey, (currentNonce + 1).toString());
    return currentNonce;
  }

  // If nonce not in Redis, we need to acquire a lock before querying blockchain
  let retries = 0;
  while (retries < maxRetries) {
    // Try to acquire the lock with expiration
    const acquired = await redis.set(lockKey, '1', 'PX', lockTimeout, 'NX');

    if (acquired) {
      try {
        // Check once more if another process set the nonce while we were waiting
        const redisNonce = await redis.get(nonceKey);
        if (redisNonce !== null) {
          const currentNonce = parseInt(redisNonce, 10);
          await redis.set(nonceKey, (currentNonce + 1).toString());
          return currentNonce;
        }

        // Fetch nonce from blockchain
        const publicClient = getPublicClientByChainId(chainId);
        const currentNonce = await publicClient.getTransactionCount({ address });

        // Store the incremented nonce in Redis
        await redis.set(nonceKey, (currentNonce + 1).toString());

        return currentNonce;
      } finally {
        // Release the lock
        await redis.del(lockKey);
      }
    }

    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, retryDelay));
    retries++;
  }

  // If we couldn't acquire the lock after all retries, throw an error
  throw new Error(`Could not acquire lock for nonce after ${maxRetries} attempts`);
}



// Function to initialize or update relayer keys in Redis
async function initializeRelayerKeys() {
  const envKeys = (process.env.RELAYER_PRIVATE_KEYS || '').split(',').filter(key => key.trim());
  
  // Get existing keys from Redis
  const existingKeys = await redis.zrange(RELAYER_KEYS_SET, 0, -1);
  
  // Compare sets
  const envSet = new Set(envKeys);
  const redisSet = new Set(existingKeys);
  // Check if sets are different
  if (envSet.size !== redisSet.size || 
      !Array.from(envSet).every(key => redisSet.has(key))) {
    // Clear existing set
    await redis.del(RELAYER_KEYS_SET);
    
    // Add all keys with score 0
    if (envKeys.length > 0) {
      const entries = envKeys.map(key => [0, key]);
      await redis.zadd(RELAYER_KEYS_SET, ...entries.flat());
    }
  }
}

// Function to get a relayer key using atomic round-robin selection
async function getRelayerKeyWithRoundRobin(): Promise<HexString> {
  // Get the key with the lowest score directly
  const keys = await redis.zrange(RELAYER_KEYS_SET, 0, 0);

  if (!keys || keys.length === 0) {
    throw new Error('No relayer keys available');
  }

  const privateKey = keys[0] as HexString;

  // Increment the score atomically
  await redis.zincrby(RELAYER_KEYS_SET, 1, privateKey);

  return privateKey;
}

function createWorker() {
  // Worker to process transaction jobs
  const worker = new Worker<TxJobData>('transaction-processing', async job => {
    const { chainId, player, sessionId, playerMoveId } = job.data;

    try {
      // Get a relayer key using the atomic round-robin function
      const privateKey = await getRelayerKeyWithRoundRobin();
      
      // Create account from the selected private key
      const account = privateKeyToAccount(privateKey);

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

      await prisma.playerMove.update({
        where: { id: playerMoveId },
        data: { txHash },
      });

      return txHash;
    } catch (error) {
      console.error('Transaction processing failed:', error);
      throw error;
    }
  }, {
    connection: redisConnection,
    concurrency: 1,
  });

  worker.on('completed', job => {
    console.log(`Job ${job.id} completed. Transaction hash: ${job.returnvalue}`);
  });

  worker.on('failed', (job, error) => {
    console.error(`Job ${job?.id} failed:`, error);
  });

  return worker;
}

export default async function main() {
  try {
    await initializeRelayerKeys();
    const worker = createWorker();

    // Handle process termination
    process.on('SIGTERM', async () => {
      await worker.close();
      await redis.quit();
      await prisma.$disconnect();
    });
  } catch (error) {
    console.error('Failed to start worker:', error);
    process.exit(1);
  }
}
