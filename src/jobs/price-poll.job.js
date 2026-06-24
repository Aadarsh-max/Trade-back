import cron from 'node-cron';
import { fetchQuoteFromProvider } from '../modules/market-data/market.service.js';
import { setCachedQuote } from '../modules/market-data/market.cache.js';

const TRACKED_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT'];

const pollPrices = async () => {
  for (const symbol of TRACKED_SYMBOLS) {
    try {
      const quote = await fetchQuoteFromProvider(symbol);
      await setCachedQuote(symbol, quote);
    } catch (err) {
      console.error(`Failed to poll price for ${symbol}`, err.message);
    }
  }
};

export const startPricePolling = () => {
  cron.schedule('*/5 * * * * *', pollPrices);
  console.log('Price polling job started, tracking', TRACKED_SYMBOLS.join(', '));
};