import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import redisClient from '../config/redis.config.js';

const buildLimiter = ({ windowMs, max, message }) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, statusCode: 429, message },
    store: new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
    }),
  });
};

export const globalLimiter = buildLimiter({
  windowMs: 60 * 1000,
  max: 100,
  message: 'Too many requests, please slow down',
});

export const authLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many auth attempts, please try again later',
});

export const orderLimiter = buildLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Too many order requests, please slow down',
});