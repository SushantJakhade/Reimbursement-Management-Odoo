import { z } from 'zod';

export const createWorkflowSchema = z.object({
  expenseId: z.string().uuid(),
});

export type CreateWorkflowDto = z.infer<typeof createWorkflowSchema>;
