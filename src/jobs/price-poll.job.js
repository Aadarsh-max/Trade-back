import cron from 'node-cron';
import { fetchQuoteFromProvider } from '../modules/market-data/market.service.js';
import { setCachedQuote } from '../modules/market-data/market.cache.js';
import { broadcastPriceUpdate } from '../sockets/price.socket.js';

const TRACKED_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT'];

let symbolIndex = 0;

const pollNextPrice = async () => {
  const symbol = TRACKED_SYMBOLS[symbolIndex % TRACKED_SYMBOLS.length];
  symbolIndex++;

  try {
    const quote = await fetchQuoteFromProvider(symbol);
    await setCachedQuote(symbol, quote);
    broadcastPriceUpdate(symbol, quote);
  } catch (err) {
    console.error(`Failed to poll price for ${symbol}`, err.message);
  }
};

export const startPricePolling = () => {
  cron.schedule('*/12 * * * * *', pollNextPrice);
  console.log('Price polling started (Twelve Data), tracking', TRACKED_SYMBOLS.join(', '));
};