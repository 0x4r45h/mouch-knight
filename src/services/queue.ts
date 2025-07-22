import { Queue } from 'bullmq';
import {HexString} from "@/config";

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
// Create a queue for sending user score
export const sendScoreQueue = new Queue('send-user-score', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'fixed',
      delay: 2000,
    },
  },
});


export interface SendUserScoreJobData {
  type: 'SendUserScoreJobData';
  chainId: number;
  playerAddress: HexString;
  scoreAmount: number;
  transactionAmount: number;
}

// Job data type definition
export interface TxJobData {
  type: 'TxJobData';
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
    jobData: TxJobData | SendUserScoreJobData,
    options?: { delay?: number }
): Promise<string | undefined> => {
  let job;
  switch (jobData.type) {
    case 'SendUserScoreJobData':
      job = await sendScoreQueue.add('send-user-score', jobData, options);
      break;
    case 'TxJobData':
      job = await txProcessingQueue.add('process-transaction', jobData, options);
      break;
    default:
      throw new Error('Invalid job data type');
  }
  return job.id;
};
