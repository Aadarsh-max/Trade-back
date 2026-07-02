import Redis from 'ioredis';
import { env } from './env.js';

const redisClient = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  tls: env.REDIS_URL.startsWith('rediss://') ? {} : undefined,
});

redisClient.on('error', (err) => {
  console.error('Redis connection error', err);
});

export default redisClient;