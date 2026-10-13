import { userSchema } from '@taekbae/types';
import { z } from 'zod';

export const adminUserSchema = userSchema.extend({ role: z.literal('ADMIN') });

export type AdminUser = z.infer<typeof adminUserSchema>;
