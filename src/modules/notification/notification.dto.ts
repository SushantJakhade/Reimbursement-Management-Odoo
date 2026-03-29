import { z } from 'zod';

export const notificationFilterSchema = z.object({
  isRead: z.string().optional(),
  type: z.string().optional(),
});
