import { z } from 'zod';

export const quoteQuerySchema = z.object({
  symbol: z.string().min(2).max(20),
});

export const candlesQuerySchema = z.object({
  symbol: z.string().min(2).max(20),
  interval: z.enum(['1m', '5m', '15m', '1h', '4h', '1d']).optional(),
  limit: z.string().optional(),
});

export const multiQuoteSchema = z.object({
  symbols: z.array(z.string().min(2).max(20)).min(1).max(20),
});