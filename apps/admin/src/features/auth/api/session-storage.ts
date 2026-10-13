import { AuthError } from '@taekbae/api';
import * as SecureStore from 'expo-secure-store';
import { z } from 'zod';

import { adminUserSchema } from '@/entities/user';

const SESSION_STORAGE_KEY = 'taekbaewatshong.admin.auth.session';

const adminSessionSchema = z.object({
  accessToken: z.string().min(1),
  expiresAt: z.number(),
  user: adminUserSchema,
});

export type AdminSession = z.infer<typeof adminSessionSchema>;

export async function storeAdminSession(session: AdminSession): Promise<void> {
  await SecureStore.setItemAsync(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export async function readStoredAdminSession(): Promise<AdminSession | null> {
  const value = await SecureStore.getItemAsync(SESSION_STORAGE_KEY);

  if (value === null) {
    return null;
  }

  let payload: unknown;
  try {
    payload = JSON.parse(value);
  } catch {
    throw new AuthError('저장된 관리자 로그인 정보가 손상되었습니다.');
  }

  const parsed = adminSessionSchema.safeParse(payload);

  if (!parsed.success) {
    throw new AuthError('저장된 관리자 로그인 정보 형식이 올바르지 않습니다.');
  }

  return parsed.data;
}

export async function clearStoredAdminSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_STORAGE_KEY);
}
