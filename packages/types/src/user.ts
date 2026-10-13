import { z } from 'zod';

export const userRoleSchema = z.enum(['STUDENT', 'TEACHER', 'ADMIN']);

/** `GET /api/users/me` 응답. */
export const userSchema = z.object({
  id: z.number(),
  email: z.string().min(1),
  name: z.string().min(1),
  role: userRoleSchema,
});

/** `GET /auth/token` 응답. */
export const tokenResponseSchema = z.object({
  token: z.string().min(1),
});

export type UserRole = z.infer<typeof userRoleSchema>;
export type User = z.infer<typeof userSchema>;
export type TokenResponse = z.infer<typeof tokenResponseSchema>;
