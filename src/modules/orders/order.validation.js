import { z } from 'zod';

export const placeOrderSchema = z.object({
  symbol: z.string().min(2).max(20),
  side: z.enum(['BUY', 'SELL']),
  type: z.enum(['MARKET', 'LIMIT']),
  quantity: z.number().positive(),
  limitPrice: z.number().positive().optional(),
}).refine(
  (data) => data.type === 'MARKET' || (data.type === 'LIMIT' && data.limitPrice !== undefined),
  { message: 'limitPrice is required for LIMIT orders', path: ['limitPrice'] }
);