import { z } from 'zod';

export const processReimbursementSchema = z.object({
  paymentMethod: z.enum(['BANK_TRANSFER', 'CHECK', 'WALLET', 'PAYPAL']).optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['PROCESSING', 'COMPLETED', 'FAILED']),
  referenceNumber: z.string().optional(),
  failureReason: z.string().optional(),
});

export type ProcessReimbursementDto = z.infer<typeof processReimbursementSchema>;
export type UpdateStatusDto = z.infer<typeof updateStatusSchema>;
