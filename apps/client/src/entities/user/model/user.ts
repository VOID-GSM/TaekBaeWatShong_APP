import { userSchema } from '@taekbae/types';
import { z } from 'zod';

export const userRoleSchema = z.enum(['STUDENT', 'TEACHER']);

export const appUserSchema = userSchema.extend({ role: userRoleSchema });

export type AppUser = z.infer<typeof appUserSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;
