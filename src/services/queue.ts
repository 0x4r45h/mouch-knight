import { Queue } from 'bullmq';

// Redis connection configuration
const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
};

// Create a queue for transaction processing
export const txProcessingQueue = new Queue('transaction-processing', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'fixed',
      delay: 2000,
    },
  },
});

// Job data type definition
export interface TxJobData {
  chainId: number;
  player: string;
  payload: PlayerMoveTx | UpdateHighscoreTx;
}

export interface PlayerMoveTx {
  type: 'PlayerMoveTx';
  sessionId: number;
  playerMoveId: number;
}

export interface UpdateHighscoreTx {
  type: 'UpdateHighscoreTx';
}

// Add a job to the queue
export const addTxJob = async (
  jobData: TxJobData
): Promise<string | undefined> => {
  const job = await txProcessingQueue.add('process-transaction', jobData);
  return job.id;
};