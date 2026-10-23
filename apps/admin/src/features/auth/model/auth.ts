import {
  AuthError,
  exchangeAuthCode,
  fetchCurrentUser,
  type OAuthProvider,
  readTokenExpiresAt,
  resolveApiBaseUrl,
} from '@taekbae/api';

import { adminUserSchema } from '@/entities/user';

import { requestOAuthCode } from '../api/oauth-login';
import {
  type AdminSession,
  clearStoredAdminSession,
  readStoredAdminSession,
  storeAdminSession,
} from '../api/session-storage';
import { useAdminAuthStore } from './auth-store';

function getErrorMessage(error: unknown): string {
  return error instanceof AuthError
    ? error.message
    : '로그인 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.';
}

async function createSession(code: string): Promise<AdminSession> {
  const baseUrl = resolveApiBaseUrl(process.env.EXPO_PUBLIC_API_URL);
  const accessToken = await exchangeAuthCode(baseUrl, code);
  const expiresAt = readTokenExpiresAt(accessToken);

  if (expiresAt === null) {
    throw new AuthError('인증 서버가 올바르지 않은 토큰을 반환했습니다.');
  }

  const user = adminUserSchema.safeParse(await fetchCurrentUser(baseUrl, accessToken));

  if (!user.success) {
    throw new AuthError('관리자 계정으로만 로그인할 수 있습니다.');
  }

  const session: AdminSession = { accessToken, expiresAt, user: user.data };
  await storeAdminSession(session);
  return session;
}

async function restoreSession(): Promise<AdminSession | null> {
  try {
    const session = await readStoredAdminSession();

    if (!session || session.expiresAt <= Date.now()) {
      if (session) {
        await clearStoredAdminSession();
      }
      useAdminAuthStore.getState().clear();
      return null;
    }

    useAdminAuthStore.getState().setUser(session.user);
    return session;
  } catch (error) {
    useAdminAuthStore.getState().setStatus('unauthenticated');
    useAdminAuthStore.getState().setError(getErrorMessage(error));
    throw error;
  }
}

export async function loginAdmin(provider: OAuthProvider): Promise<boolean> {
  const { status, user } = useAdminAuthStore.getState();
  useAdminAuthStore.getState().setStatus('loading');
  useAdminAuthStore.getState().setError(null);

  try {
    const code = await requestOAuthCode(provider);

    if (code === null) {
      useAdminAuthStore.setState({ status, user });
      return false;
    }

    const session = await createSession(code);
    useAdminAuthStore.getState().setUser(session.user);
    return true;
  } catch (error) {
    useAdminAuthStore.setState({ status, user, error: getErrorMessage(error) });
    throw error;
  }
}

export async function initializeAdminAuthSession(): Promise<void> {
  useAdminAuthStore.getState().setStatus('initializing');
  await restoreSession();
}

export async function getAdminAccessToken(): Promise<string | null> {
  const session = await restoreSession();
  return session?.accessToken ?? null;
}

export async function logoutAdmin(): Promise<void> {
  try {
    await clearStoredAdminSession();
    useAdminAuthStore.getState().clear();
  } catch (error) {
    useAdminAuthStore.getState().setError(getErrorMessage(error));
    throw error;
  }
}
