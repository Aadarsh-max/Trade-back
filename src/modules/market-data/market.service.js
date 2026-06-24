import axios from 'axios';
import { ApiError } from '../../utils/apiError.js';
import { getCachedQuote, setCachedQuote, getCachedCandles, setCachedCandles } from './market.cache.js';

const BINANCE_BASE_URL = 'https://api.binance.com/api/v3';

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
  const cached = await getCachedQuote(symbol);

  if (cached) {
    return cached;
  }

  const quote = await fetchQuoteFromProvider(symbol);

  await setCachedQuote(symbol, quote);

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
  const cached = await getCachedCandles(symbol, interval, limit);

  if (cached) {
    return cached;
  }

  const candles = await fetchCandlesFromProvider(symbol, interval, limit);

  await setCachedCandles(symbol, interval, limit, candles);

  return candles;
};

export const getMultipleQuotes = async (symbols) => {
  const quotes = await Promise.all(symbols.map((symbol) => getQuote(symbol)));
  return quotes;
};