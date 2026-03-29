import { z } from 'zod';

export const createReportSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  currency: z.string().length(3).optional(),
});

export const updateReportSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
});

export type CreateReportDto = z.infer<typeof createReportSchema>;
export type UpdateReportDto = z.infer<typeof updateReportSchema>;
