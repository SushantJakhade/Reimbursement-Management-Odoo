import { z } from 'zod';

export const uploadReceiptSchema = z.object({
  expenseId: z.string().uuid(),
});

export type UploadReceiptDto = z.infer<typeof uploadReceiptSchema>;
