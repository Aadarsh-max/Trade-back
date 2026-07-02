import axios from 'axios';
import { ApiError } from '../../utils/apiError.js';
import { getCachedQuote, setCachedQuote, getCachedCandles, setCachedCandles } from './market.cache.js';
import { env } from '../../config/env.js';

const TWELVE_BASE_URL = 'https://api.twelvedata.com';

const SYMBOL_MAP = {
  BTCUSDT: 'BTC/USD',
  ETHUSDT: 'ETH/USD',
  SOLUSDT: 'SOL/USD',
  BNBUSDT: 'BNB/USD',
  XRPUSDT: 'XRP/USD',
  ADAUSDT: 'ADA/USD',
  DOGEUSDT: 'DOGE/USD',
  MATICUSDT: 'MATIC/USD',
  DOTUSDT: 'DOT/USD',
  LINKUSDT: 'LINK/USD',
};

const toTwelveSymbol = (symbol) => {
  return SYMBOL_MAP[symbol.toUpperCase()] || symbol.replace('USDT', '/USD');
};

export const fetchQuoteFromProvider = async (symbol) => {
  const twelveSymbol = toTwelveSymbol(symbol);

  try {
    const response = await axios.get(`${TWELVE_BASE_URL}/price`, {
      params: {
        symbol: twelveSymbol,
        apikey: env.MARKET_DATA_API_KEY,
      },
      timeout: 10000,
    });

    if (response.data.status === 'error' || !response.data.price) {
      throw new ApiError(502, `Failed to fetch quote for ${symbol}`);
    }

    return {
      symbol: symbol.toUpperCase(),
      price: parseFloat(response.data.price),
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
  const twelveSymbol = toTwelveSymbol(symbol);

  const intervalMap = {
    '1m': '1min',
    '5m': '5min',
    '15m': '15min',
    '1h': '1h',
    '4h': '4h',
    '1d': '1day',
  };

  const twelveInterval = intervalMap[interval] || '1h';

  try {
    const response = await axios.get(`${TWELVE_BASE_URL}/time_series`, {
      params: {
        symbol: twelveSymbol,
        interval: twelveInterval,
        outputsize: Math.min(limit, 500),
        apikey: env.MARKET_DATA_API_KEY,
      },
      timeout: 15000,
    });

    if (response.data.status === 'error' || !response.data.values) {
      throw new ApiError(502, `Failed to fetch candles for ${symbol}`);
    }

    return response.data.values
      .map((candle) => ({
        openTime: new Date(candle.datetime).getTime(),
        open: parseFloat(candle.open),
        high: parseFloat(candle.high),
        low: parseFloat(candle.low),
        close: parseFloat(candle.close),
        volume: parseFloat(candle.volume || 0),
        closeTime: new Date(candle.datetime).getTime() + 3600000,
      }))
      .reverse();
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

  return results
    .map((result, index) => {
      if (result.status === 'fulfilled') return result.value;
      return { symbol: symbols[index], price: 0, fetchedAt: new Date().toISOString() };
    });
};