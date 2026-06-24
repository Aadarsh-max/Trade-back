import { getQuote, getCandles, getMultipleQuotes } from './market.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/apiError.js';

export const getSymbolQuote = async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const quote = await getQuote(symbol);
    return new ApiResponse(200, 'Quote fetched', quote).send(res);
  } catch (err) {
    next(err);
  }
};

export const getSymbolCandles = async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const interval = req.query.interval || '1h';
    const limit = parseInt(req.query.limit) || 100;

    if (limit > 1000) {
      throw new ApiError(400, 'Limit cannot exceed 1000');
    }

    const candles = await getCandles(symbol, interval, limit);
    return new ApiResponse(200, 'Candles fetched', candles).send(res);
  } catch (err) {
    next(err);
  }
};

export const getBatchQuotes = async (req, res, next) => {
  try {
    const { symbols } = req.body;
    const quotes = await getMultipleQuotes(symbols);
    return new ApiResponse(200, 'Quotes fetched', quotes).send(res);
  } catch (err) {
    next(err);
  }
};