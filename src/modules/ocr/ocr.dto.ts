import { z } from 'zod';

export const processOcrSchema = z.object({
  receiptId: z.string().uuid(),
});

export const batchOcrSchema = z.object({
  receiptIds: z.array(z.string().uuid()).min(1).max(10),
});

export type ProcessOcrDto = z.infer<typeof processOcrSchema>;
export type BatchOcrDto = z.infer<typeof batchOcrSchema>;
