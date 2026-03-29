import { z } from 'zod';

export const takeActionSchema = z.object({
  workflowId: z.string().uuid(),
  action: z.enum(['APPROVE', 'REJECT', 'DELEGATE', 'REQUEST_INFO']),
  comments: z.string().optional(),
  delegateToId: z.string().uuid().optional(),
});

export type TakeActionDto = z.infer<typeof takeActionSchema>;
