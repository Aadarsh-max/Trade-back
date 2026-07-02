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

const SYMBOL_MAP = {
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

const toFinnhubSymbol = (symbol) => {
  return SYMBOL_MAP[symbol.toUpperCase()] || `BINANCE:${symbol.toUpperCase()}`;
};

const intervalToResolution = {
  '1m': '1',
  '5m': '5',
  '15m': '15',
  '1h': '60',
  '4h': '240',
  '1d': 'D',
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
  const finnhubSymbol = toFinnhubSymbol(symbol);
  const resolution = intervalToResolution[interval] || '60';

  const now = Math.floor(Date.now() / 1000);
  const secondsPerCandle = {
    '1': 60, '5': 300, '15': 900,
    '60': 3600, '240': 14400, 'D': 86400,
  };
  const from = now - (secondsPerCandle[resolution] || 3600) * limit;

  try {
    const response = await axios.get(`${FINNHUB_BASE_URL}/crypto/candle`, {
      params: {
        symbol: finnhubSymbol,
        resolution,
        from,
        to: now,
        token: env.MARKET_DATA_API_KEY,
      },
      timeout: 15000,
    });

    if (response.data.s === 'no_data' || !response.data.t) {
      throw new ApiError(502, `No candle data for ${symbol}`);
    }

    return response.data.t.map((time, i) => ({
      openTime: time * 1000,
      open: response.data.o[i],
      high: response.data.h[i],
      low: response.data.l[i],
      close: response.data.c[i],
      volume: response.data.v[i] || 0,
      closeTime: time * 1000 + (secondsPerCandle[resolution] || 3600) * 1000,
    }));
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(502, `Failed to fetch candles for ${symbol}`);
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