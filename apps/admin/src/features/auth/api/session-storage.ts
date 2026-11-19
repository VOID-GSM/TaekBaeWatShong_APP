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

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

export async function readStoredAdminSession(): Promise<AdminSession | null> {
  const value = await SecureStore.getItemAsync(SESSION_STORAGE_KEY);

  if (value === null) {
    return null;
  }

  const parsed = adminSessionSchema.safeParse(parseJson(value));

  // 손상됐거나 형식이 바뀐 값은 다시 로그인하기 전까지 매번 실패하므로 지우고 없는 것으로 본다.
  if (!parsed.success) {
    await clearStoredAdminSession();
    return null;
  }

  return parsed.data;
}

export async function clearStoredAdminSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_STORAGE_KEY);
}
