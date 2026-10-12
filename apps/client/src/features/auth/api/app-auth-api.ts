import * as SecureStore from 'expo-secure-store';
import { z } from 'zod';

import { type AppUser, appUserSchema } from '@/entities/user';

const APP_SESSION_STORAGE_KEY = 'taekbaewatshong.auth.session';

const authResponseSchema = z.object({
  accessToken: z.string().min(1),
  expiresIn: z.number().positive(),
  user: appUserSchema,
});

const storedSessionSchema = z.object({
  accessToken: z.string().min(1),
  expiresAt: z.number(),
  user: appUserSchema,
});

export interface AppSession {
  accessToken: string;
  expiresAt: number;
  user: AppUser;
}

export class AuthenticationError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

function getApiBaseUrl(): string {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (!apiUrl) {
    throw new AuthenticationError('EXPO_PUBLIC_API_URL 환경 변수를 설정해야 합니다.');
  }

  try {
    const url = new URL(apiUrl);
    return url.toString().replace(/\/+$/, '');
  } catch {
    throw new AuthenticationError('EXPO_PUBLIC_API_URL 값이 올바른 URL이 아닙니다.');
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new AuthenticationError(
      '인증 서버가 올바르지 않은 응답을 반환했습니다.',
      response.status,
    );
  }
}

async function authenticate(
  provider: 'datagsm',
  credentials: Record<string, string>,
  allowedRoles: readonly AppUser['role'][],
): Promise<AppSession> {
  const response = await fetch(`${getApiBaseUrl()}/auth/${provider}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw new AuthenticationError(
      `로그인 요청에 실패했습니다. (HTTP ${response.status})`,
      response.status,
    );
  }

  const parsed = authResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new AuthenticationError('인증 서버 응답 형식이 올바르지 않습니다.', response.status);
  }

  if (!allowedRoles.includes(parsed.data.user.role)) {
    throw new AuthenticationError('이 로그인 방식으로는 해당 계정 유형을 사용할 수 없습니다.');
  }

  const session: AppSession = {
    accessToken: parsed.data.accessToken,
    expiresAt: Date.now() + parsed.data.expiresIn * 1000,
    user: parsed.data.user,
  };

  await SecureStore.setItemAsync(APP_SESSION_STORAGE_KEY, JSON.stringify(session));
  return session;
}

export function authenticateDataGsmUser(
  accessToken: string,
  role: 'STUDENT' | 'TEACHER',
): Promise<AppSession> {
  return authenticate('datagsm', { accessToken }, [role]);
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
    throw new AuthenticationError('저장된 로그인 정보가 손상되었습니다.');
  }

  const parsed = storedSessionSchema.safeParse(payload);

  if (!parsed.success) {
    throw new AuthenticationError('저장된 로그인 정보 형식이 올바르지 않습니다.');
  }

  return parsed.data;
}

export async function clearStoredAppSession(): Promise<void> {
  await SecureStore.deleteItemAsync(APP_SESSION_STORAGE_KEY);
}
