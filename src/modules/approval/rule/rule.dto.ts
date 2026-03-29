import { z } from 'zod';

export const createRuleSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  conditionType: z.enum(['AMOUNT_THRESHOLD', 'CATEGORY', 'DEPARTMENT', 'CUSTOM']),
  conditionValue: z.any().default({}),
  priority: z.number().int().min(0).default(0),
  steps: z.array(z.object({
    stepOrder: z.number().int().min(1),
    approverType: z.enum(['MANAGER', 'SPECIFIC_USER', 'ROLE', 'DEPARTMENT_HEAD']),
    approverId: z.string().uuid().optional(),
    requiredApprovalPercent: z.number().min(0).max(100).default(100),
    isConditional: z.boolean().default(false),
    condition: z.any().optional(),
  })).min(1),
});

export const updateRuleSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  conditionValue: z.any().optional(),
  priority: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const addStepSchema = z.object({
  stepOrder: z.number().int().min(1),
  approverType: z.enum(['MANAGER', 'SPECIFIC_USER', 'ROLE', 'DEPARTMENT_HEAD']),
  approverId: z.string().uuid().optional(),
  requiredApprovalPercent: z.number().min(0).max(100).default(100),
  isConditional: z.boolean().default(false),
  condition: z.any().optional(),
});

export type CreateRuleDto = z.infer<typeof createRuleSchema>;
export type UpdateRuleDto = z.infer<typeof updateRuleSchema>;
export type AddStepDto = z.infer<typeof addStepSchema>;
