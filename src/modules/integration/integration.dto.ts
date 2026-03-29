import { z } from 'zod';

export const createIntegrationSchema = z.object({
  type: z.enum(['PAYMENT_GATEWAY', 'ACCOUNTING', 'HR_SYSTEM', 'COMMUNICATION']),
  apiKey: z.string().optional(),
  config: z.any().default({}),
});

export const updateIntegrationSchema = z.object({
  apiKey: z.string().optional(),
  config: z.any().optional(),
  isActive: z.boolean().optional(),
});

export type CreateIntegrationDto = z.infer<typeof createIntegrationSchema>;
export type UpdateIntegrationDto = z.infer<typeof updateIntegrationSchema>;
