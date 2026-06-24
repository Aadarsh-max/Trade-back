import { z } from 'zod';

export const chatMessageSchema = z.object({
  message: z.string().min(1).max(1000),
});

export const sentimentSchema = z.object({
  headlines: z.array(z.string().min(5)).min(1).max(15),
});