import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../lib/logger';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null, // Critical setting required by BullMQ
});

redis.on('connect', () => {
  logger.info('Connected to Redis successfully.');
});

redis.on('error', (err) => {
  logger.error('Redis Client Connection Failure:', err);
});
