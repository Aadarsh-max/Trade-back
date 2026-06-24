import cron from 'node-cron';
import { generateDailySummary } from '../modules/ai/ai.service.js';
import { getQuote } from '../modules/market-data/market.service.js';
import redisClient from '../config/redis.config.js';

const TRACKED_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT'];
const SUMMARY_CACHE_KEY = 'ai:daily-summary';
const SUMMARY_TTL_SECONDS = 86400;

const buildMarketSnapshot = async () => {
  const snapshot = [];

  for (const symbol of TRACKED_SYMBOLS) {
    try {
      const quote = await getQuote(symbol);
      snapshot.push({
        symbol: quote.symbol,
        price: quote.price,
        changePercent: 0,
      });
    } catch (err) {
      console.error(`Failed to fetch quote for daily summary: ${symbol}`, err.message);
    }
  }

  return snapshot;
};

const runDailySummaryJob = async () => {
  try {
    const snapshot = await buildMarketSnapshot();

    if (snapshot.length === 0) {
      console.error('No market data available for daily summary');
      return;
    }

    const summary = await generateDailySummary(snapshot);

    await redisClient.set(
      SUMMARY_CACHE_KEY,
      JSON.stringify({ summary, generatedAt: new Date().toISOString(), snapshot }),
      'EX',
      SUMMARY_TTL_SECONDS
    );

    console.log('Daily market summary generated and cached');
  } catch (err) {
    console.error('Failed to generate daily market summary', err.message);
  }
};

export const startDailySummaryJob = () => {
  cron.schedule('0 8 * * *', runDailySummaryJob);
  console.log('Daily AI summary job scheduled for 8 AM');
};

export const getCachedDailySummary = async () => {
  const cached = await redisClient.get(SUMMARY_CACHE_KEY);
  return cached ? JSON.parse(cached) : null;
};

export const triggerDailySummaryNow = async () => {
  await runDailySummaryJob();
  return getCachedDailySummary();
};