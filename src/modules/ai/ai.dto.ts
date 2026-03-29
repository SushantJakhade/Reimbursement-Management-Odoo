import { z } from 'zod';

export const categorizeSchema = z.object({
  description: z.string(),
  merchant: z.string().optional(),
  amount: z.number().optional(),
});

export const detectDuplicatesSchema = z.object({
  expenseId: z.string().uuid(),
});

export type CategorizeDto = z.infer<typeof categorizeSchema>;
export type DetectDuplicatesDto = z.infer<typeof detectDuplicatesSchema>;
