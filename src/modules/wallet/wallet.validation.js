import { z } from 'zod';

export const depositSchema = z.object({
  amount: z.number().positive().max(1000000),
  idempotencyKey: z.string().min(10),
});

export const withdrawSchema = z.object({
  amount: z.number().positive().max(1000000),
  idempotencyKey: z.string().min(10),
});