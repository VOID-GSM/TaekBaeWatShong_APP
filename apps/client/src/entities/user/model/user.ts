import { z } from 'zod';

export const userRoleSchema = z.enum(['STUDENT', 'TEACHER']);

export const appUserSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string().min(1),
  role: userRoleSchema,
});

export type AppUser = z.infer<typeof appUserSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;
