import { z } from 'zod';

export const updateCompanySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  logo: z.string().url().optional(),
  taxId: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  defaultCurrency: z.string().length(3).optional(),
});

export type UpdateCompanyDto = z.infer<typeof updateCompanySchema>;
