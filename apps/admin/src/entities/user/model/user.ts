import { z } from 'zod';

export const adminUserSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string().min(1),
  role: z.literal('ADMIN'),
});

export type AdminUser = z.infer<typeof adminUserSchema>;
