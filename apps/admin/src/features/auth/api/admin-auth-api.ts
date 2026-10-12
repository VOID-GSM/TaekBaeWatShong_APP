import * as SecureStore from 'expo-secure-store';
import { z } from 'zod';

import { type AdminUser, adminUserSchema } from '@/entities/user';

const SESSION_STORAGE_KEY = 'taekbaewatshong.admin.auth.session';

const authResponseSchema = z.object({
  accessToken: z.string().min(1),
  expiresIn: z.number().positive(),
  user: adminUserSchema,
});

const storedSessionSchema = z.object({
  accessToken: z.string().min(1),
  expiresAt: z.number(),
  user: adminUserSchema,
});

export interface AdminSession {
  accessToken: string;
  expiresAt: number;
  user: AdminUser;
}

export class AdminAuthenticationError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'AdminAuthenticationError';
  }
}

function getApiBaseUrl(): string {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (!apiUrl) {
    throw new AdminAuthenticationError('EXPO_PUBLIC_API_URL 환경 변수를 설정해야 합니다.');
  }

  try {
    return new URL(apiUrl).toString().replace(/\/+$/, '');
  } catch {
    throw new AdminAuthenticationError('EXPO_PUBLIC_API_URL 값이 올바른 URL이 아닙니다.');
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new AdminAuthenticationError(
      '인증 서버가 올바르지 않은 응답을 반환했습니다.',
      response.status,
    );
  }
}

export async function authenticateAdmin(idToken: string): Promise<AdminSession> {
  const response = await fetch(`${getApiBaseUrl()}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw new AdminAuthenticationError(
      `Google 관리자 로그인에 실패했습니다. (HTTP ${response.status})`,
      response.status,
    );
  }

  const parsed = authResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new AdminAuthenticationError(
      '인증 서버가 관리자 계정 세션을 반환하지 않았습니다.',
      response.status,
    );
  }

  const session: AdminSession = {
    accessToken: parsed.data.accessToken,
    expiresAt: Date.now() + parsed.data.expiresIn * 1000,
    user: parsed.data.user,
  };

  await SecureStore.setItemAsync(SESSION_STORAGE_KEY, JSON.stringify(session));
  return session;
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
    throw new AdminAuthenticationError('저장된 관리자 로그인 정보가 손상되었습니다.');
  }

  const parsed = storedSessionSchema.safeParse(payload);

  if (!parsed.success) {
    throw new AdminAuthenticationError('저장된 관리자 로그인 정보 형식이 올바르지 않습니다.');
  }

  return parsed.data;
}

export async function clearStoredAdminSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_STORAGE_KEY);
}
