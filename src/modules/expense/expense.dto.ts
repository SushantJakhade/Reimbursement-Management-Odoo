import { z } from 'zod';

export const createExpenseSchema = z.object({
  reportId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  description: z.string().min(1).max(500),
  merchant: z.string().max(200).optional(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  expenseDate: z.string().transform((s) => new Date(s)),
  isRecurring: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  location: z.string().optional(),
});

export const updateExpenseSchema = z.object({
  categoryId: z.string().uuid().optional(),
  description: z.string().min(1).max(500).optional(),
  merchant: z.string().max(200).optional(),
  amount: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  expenseDate: z.string().transform((s) => new Date(s)).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  location: z.string().optional(),
});

export const expenseFilterSchema = z.object({
  status: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
  merchant: z.string().optional(),
});

export type CreateExpenseDto = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseDto = z.infer<typeof updateExpenseSchema>;
