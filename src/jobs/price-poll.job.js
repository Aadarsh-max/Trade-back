import cron from 'node-cron';
import { getMultipleQuotes } from '../modules/market-data/market.service.js';
import { setCachedQuote } from '../modules/market-data/market.cache.js';
import { broadcastPriceUpdate } from '../sockets/price.socket.js';

const TRACKED_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT'];

const pollPrices = async () => {
  try {
    const quotes = await getMultipleQuotes(TRACKED_SYMBOLS);
    for (const quote of quotes) {
      if (quote.price > 0) {
        await setCachedQuote(quote.symbol, quote);
        broadcastPriceUpdate(quote.symbol, quote);
      }
    }
  } catch (err) {
    console.error('Price polling failed:', err.message);
  }
};

export const startPricePolling = () => {
  cron.schedule('*/30 * * * * *', pollPrices);
  console.log('Price polling started (Finnhub), tracking', TRACKED_SYMBOLS.join(', '));
};