import axios from 'axios';
import redisClient from '../../config/redis.config.js';
import { ApiError } from '../../utils/apiError.js';

const BINANCE_BASE_URL = 'https://api.binance.com/api/v3';
const CACHE_TTL_SECONDS = 5;

export const fetchQuoteFromProvider = async (symbol) => {
  try {
    const response = await axios.get(`${BINANCE_BASE_URL}/ticker/price`, {
      params: { symbol: symbol.toUpperCase() },
    });

    return {
      symbol: response.data.symbol,
      price: parseFloat(response.data.price),
      fetchedAt: new Date().toISOString(),
    };
  } catch (err) {
    throw new ApiError(502, `Failed to fetch quote for ${symbol}`);
  }
};

export const getQuote = async (symbol) => {
  const cacheKey = `quote:${symbol.toUpperCase()}`;

  const cached = await redisClient.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  const quote = await fetchQuoteFromProvider(symbol);

  await redisClient.set(cacheKey, JSON.stringify(quote), 'EX', CACHE_TTL_SECONDS);

  return quote;
};

export const fetchCandlesFromProvider = async (symbol, interval, limit) => {
  try {
    const response = await axios.get(`${BINANCE_BASE_URL}/klines`, {
      params: {
        symbol: symbol.toUpperCase(),
        interval,
        limit,
      },
    });

    return response.data.map((candle) => ({
      openTime: candle[0],
      open: parseFloat(candle[1]),
      high: parseFloat(candle[2]),
      low: parseFloat(candle[3]),
      close: parseFloat(candle[4]),
      volume: parseFloat(candle[5]),
      closeTime: candle[6],
    }));
  } catch (err) {
    throw new ApiError(502, `Failed to fetch candles for ${symbol}`);
  }
};

export const getCandles = async (symbol, interval = '1h', limit = 100) => {
  const cacheKey = `candles:${symbol.toUpperCase()}:${interval}:${limit}`;
  const cacheTtl = 30;

  const cached = await redisClient.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  const candles = await fetchCandlesFromProvider(symbol, interval, limit);

  await redisClient.set(cacheKey, JSON.stringify(candles), 'EX', cacheTtl);

  return candles;
};

export const getMultipleQuotes = async (symbols) => {
  const quotes = await Promise.all(symbols.map((symbol) => getQuote(symbol)));
  return quotes;
};