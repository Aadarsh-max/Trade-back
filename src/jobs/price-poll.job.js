import cron from 'node-cron';
import { fetchQuoteFromProvider } from '../modules/market-data/market.service.js';
import redisClient from '../config/redis.config.js';

const TRACKED_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT'];
const POLL_TTL_SECONDS = 10;

const pollPrices = async () => {
  for (const symbol of TRACKED_SYMBOLS) {
    try {
      const quote = await fetchQuoteFromProvider(symbol);
      const cacheKey = `quote:${symbol}`;
      await redisClient.set(cacheKey, JSON.stringify(quote), 'EX', POLL_TTL_SECONDS);
    } catch (err) {
      console.error(`Failed to poll price for ${symbol}`, err.message);
    }
  }
};

export const startPricePolling = () => {
  cron.schedule('*/5 * * * * *', pollPrices);
  console.log('Price polling job started, tracking', TRACKED_SYMBOLS.join(', '));
};