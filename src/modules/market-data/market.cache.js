import redisClient from '../../config/redis.config.js';

const QUOTE_TTL_SECONDS = 5;
const CANDLES_TTL_SECONDS = 30;

export const getCachedQuote = async (symbol) => {
  const cacheKey = `quote:${symbol.toUpperCase()}`;
  const cached = await redisClient.get(cacheKey);
  return cached ? JSON.parse(cached) : null;
};

export const setCachedQuote = async (symbol, quote) => {
  const cacheKey = `quote:${symbol.toUpperCase()}`;
  await redisClient.set(cacheKey, JSON.stringify(quote), 'EX', QUOTE_TTL_SECONDS);
};

export const getCachedCandles = async (symbol, interval, limit) => {
  const cacheKey = `candles:${symbol.toUpperCase()}:${interval}:${limit}`;
  const cached = await redisClient.get(cacheKey);
  return cached ? JSON.parse(cached) : null;
};

export const setCachedCandles = async (symbol, interval, limit, candles) => {
  const cacheKey = `candles:${symbol.toUpperCase()}:${interval}:${limit}`;
  await redisClient.set(cacheKey, JSON.stringify(candles), 'EX', CANDLES_TTL_SECONDS);
};