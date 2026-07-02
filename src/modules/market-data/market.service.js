import axios from 'axios';
import { ApiError } from '../../utils/apiError.js';
import {
  getCachedQuote,
  setCachedQuote,
  getCachedCandles,
  setCachedCandles,
} from './market.cache.js';
import { env } from '../../config/env.js';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const COINBASE_BASE_URL = 'https://api.exchange.coinbase.com';

const FINNHUB_SYMBOL_MAP = {
  BTCUSDT: 'BINANCE:BTCUSDT',
  ETHUSDT: 'BINANCE:ETHUSDT',
  SOLUSDT: 'BINANCE:SOLUSDT',
  BNBUSDT: 'BINANCE:BNBUSDT',
  XRPUSDT: 'BINANCE:XRPUSDT',
  ADAUSDT: 'BINANCE:ADAUSDT',
  DOGEUSDT: 'BINANCE:DOGEUSDT',
  MATICUSDT: 'BINANCE:MATICUSDT',
  DOTUSDT: 'BINANCE:DOTUSDT',
  LINKUSDT: 'BINANCE:LINKUSDT',
};

const COINBASE_PRODUCT_MAP = {
  BTCUSDT: 'BTC-USD',
  ETHUSDT: 'ETH-USD',
  SOLUSDT: 'SOL-USD',
  BNBUSDT: 'BNB-USD',
  XRPUSDT: 'XRP-USD',
  ADAUSDT: 'ADA-USD',
  DOGEUSDT: 'DOGE-USD',
  MATICUSDT: 'MATIC-USD',
  DOTUSDT: 'DOT-USD',
  LINKUSDT: 'LINK-USD',
};

const toFinnhubSymbol = (symbol) => {
  return FINNHUB_SYMBOL_MAP[symbol.toUpperCase()] || `BINANCE:${symbol.toUpperCase()}`;
};

const toCoinbaseProduct = (symbol) => {
  return COINBASE_PRODUCT_MAP[symbol.toUpperCase()] || `${symbol.replace('USDT', '')}-USD`;
};

const intervalToGranularity = {
  '1m': 60,
  '5m': 300,
  '15m': 900,
  '1h': 3600,
  '4h': 14400,
  '1d': 86400,
};

export const fetchQuoteFromProvider = async (symbol) => {
  const finnhubSymbol = toFinnhubSymbol(symbol);

  try {
    const response = await axios.get(`${FINNHUB_BASE_URL}/quote`, {
      params: {
        symbol: finnhubSymbol,
        token: env.MARKET_DATA_API_KEY,
      },
      timeout: 10000,
    });

    if (!response.data.c || response.data.c === 0) {
      throw new ApiError(502, `No price data for ${symbol}`);
    }

    return {
      symbol: symbol.toUpperCase(),
      price: response.data.c,
      change24h: response.data.dp || 0,
      fetchedAt: new Date().toISOString(),
    };
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(502, `Failed to fetch quote for ${symbol}`);
  }
};

export const getQuote = async (symbol) => {
  const cached = await getCachedQuote(symbol);
  if (cached) return cached;

  const quote = await fetchQuoteFromProvider(symbol);
  await setCachedQuote(symbol, quote);
  return quote;
};

export const fetchCandlesFromProvider = async (symbol, interval, limit) => {
  const product = toCoinbaseProduct(symbol);
  const granularity = intervalToGranularity[interval] || 3600;

  const end = new Date();
  const start = new Date(end.getTime() - granularity * limit * 1000);

  try {
    const response = await axios.get(
      `${COINBASE_BASE_URL}/products/${product}/candles`,
      {
        params: {
          granularity,
          start: start.toISOString(),
          end: end.toISOString(),
        },
        headers: {
          'User-Agent': 'TradeflowApp/1.0',
        },
        timeout: 15000,
      }
    );

    if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
      throw new ApiError(502, `No candle data for ${symbol}`);
    }

    return response.data
      .map((candle) => ({
        openTime: candle[0] * 1000,
        open: candle[3],
        high: candle[2],
        low: candle[1],
        close: candle[4],
        volume: candle[5] || 0,
        closeTime: candle[0] * 1000 + granularity * 1000,
      }))
      .sort((a, b) => a.openTime - b.openTime);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(502, `Failed to fetch candles for ${symbol}: ${err.message}`);
  }
};

export const getCandles = async (symbol, interval = '1h', limit = 100) => {
  const cached = await getCachedCandles(symbol, interval, limit);
  if (cached) return cached;

  const candles = await fetchCandlesFromProvider(symbol, interval, limit);
  await setCachedCandles(symbol, interval, limit, candles);
  return candles;
};

export const getMultipleQuotes = async (symbols) => {
  const results = await Promise.allSettled(
    symbols.map((symbol) => getQuote(symbol))
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') return result.value;
    return {
      symbol: symbols[index].toUpperCase(),
      price: 0,
      fetchedAt: new Date().toISOString(),
    };
  });
};