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

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

export async function readStoredAppSession(): Promise<AppSession | null> {
  const value = await SecureStore.getItemAsync(APP_SESSION_STORAGE_KEY);

  if (value === null) {
    return null;
  }

  const parsed = appSessionSchema.safeParse(parseJson(value));

  // 손상됐거나 형식이 바뀐 값은 다시 로그인하기 전까지 매번 실패하므로 지우고 없는 것으로 본다.
  if (!parsed.success) {
    await clearStoredAppSession();
    return null;
  }

  return parsed.data;
}

export async function clearStoredAppSession(): Promise<void> {
  await SecureStore.deleteItemAsync(APP_SESSION_STORAGE_KEY);
}
