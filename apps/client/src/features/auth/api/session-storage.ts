import { AuthError } from '@taekbae/api';
import * as SecureStore from 'expo-secure-store';
import { z } from 'zod';

import { appUserSchema } from '@/entities/user';

const APP_SESSION_STORAGE_KEY = 'taekbaewatshong.auth.session';

const appSessionSchema = z.object({
  accessToken: z.string().min(1),
  expiresAt: z.number(),
  user: appUserSchema,
});

export type AppSession = z.infer<typeof appSessionSchema>;

export async function storeAppSession(session: AppSession): Promise<void> {
  await SecureStore.setItemAsync(APP_SESSION_STORAGE_KEY, JSON.stringify(session));
}

export async function readStoredAppSession(): Promise<AppSession | null> {
  const value = await SecureStore.getItemAsync(APP_SESSION_STORAGE_KEY);

  if (value === null) {
    return null;
  }

  let payload: unknown;
  try {
    payload = JSON.parse(value);
  } catch {
    throw new AuthError('저장된 로그인 정보가 손상되었습니다.');
  }

  const parsed = appSessionSchema.safeParse(payload);

  if (!parsed.success) {
    throw new AuthError('저장된 로그인 정보 형식이 올바르지 않습니다.');
  }

  return parsed.data;
}

export async function clearStoredAppSession(): Promise<void> {
  await SecureStore.deleteItemAsync(APP_SESSION_STORAGE_KEY);
}
