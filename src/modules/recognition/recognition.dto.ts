import { z } from 'zod';

export const awardPointsSchema = z.object({
  userId: z.string().uuid(),
  points: z.number().int().positive(),
  type: z.enum(['EARNED', 'BONUS']).default('BONUS'),
  reason: z.string().min(1),
});

export type AwardPointsDto = z.infer<typeof awardPointsSchema>;
