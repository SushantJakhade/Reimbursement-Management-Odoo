import { z } from 'zod';

export const createDepartmentSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(20),
  headId: z.string().uuid().optional(),
  budget: z.number().min(0).optional(),
});

export const updateDepartmentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  headId: z.string().uuid().nullable().optional(),
  budget: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

export type CreateDepartmentDto = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentDto = z.infer<typeof updateDepartmentSchema>;
