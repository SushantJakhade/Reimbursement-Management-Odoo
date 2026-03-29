import { z } from 'zod';

export const createBudgetSchema = z.object({
  departmentId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  amount: z.number().positive(),
  period: z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']),
  startDate: z.string().transform((s) => new Date(s)).optional(),
  endDate: z.string().transform((s) => new Date(s)).optional(),
  alertThreshold: z.number().min(0).max(100).default(90),
});

export const updateBudgetSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  amount: z.number().positive().optional(),
  alertThreshold: z.number().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
});

export type CreateBudgetDto = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetDto = z.infer<typeof updateBudgetSchema>;
