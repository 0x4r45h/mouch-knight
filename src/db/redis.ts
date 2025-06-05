import Redis from 'ioredis';

export const redisConnection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null,
};

// Create a global redis instance to prevent multiple instances in development
const globalForRedis = global as unknown as { redis: Redis };
// Redis connection configuration
export const redis = globalForRedis.redis || new Redis(redisConnection);

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

export default redis;