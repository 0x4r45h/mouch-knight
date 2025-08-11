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
  sessionId: number;
  playerId: number
  playerAddress: HexString;
  scoreAmount: number;
  transactionAmount: number;
}

// Job data type definition
export interface TxJobData {
  type: 'TxJobData';
  chainId: number;
  player: string;
  sessionId: number;
  payload: PlayerMoveTx | UpdateHighscoreTx;
}

export interface PlayerMoveTx {
  type: 'PlayerMoveTx';
  playerMoveId: number;
}

export interface UpdateHighscoreTx {
  type: 'UpdateHighscoreTx';
  playerId: number
}

// Add a job to the queue
export const addTxJob = async (
    jobData: TxJobData | SendUserScoreJobData,
    options?: { delay?: number }
): Promise<string> => {
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
  return job.id ? job.id : '';
};
