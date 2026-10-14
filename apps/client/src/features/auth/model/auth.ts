import {
  AuthError,
  exchangeAuthCode,
  fetchCurrentUser,
  readTokenExpiresAt,
  resolveApiBaseUrl,
} from '@taekbae/api';

import { appUserSchema } from '@/entities/user';

import { requestGoogleAuthCode } from '../api/oauth-login';
import {
  type AppSession,
  clearStoredAppSession,
  readStoredAppSession,
  storeAppSession,
} from '../api/session-storage';
import { useAuthStore } from './auth-store';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '알 수 없는 인증 오류가 발생했습니다.';
}

async function createSession(code: string): Promise<AppSession> {
  const baseUrl = resolveApiBaseUrl(process.env.EXPO_PUBLIC_API_URL);
  const accessToken = await exchangeAuthCode(baseUrl, code);
  const expiresAt = readTokenExpiresAt(accessToken);

  if (expiresAt === null) {
    throw new AuthError('인증 서버가 올바르지 않은 토큰을 반환했습니다.');
  }

  const user = appUserSchema.safeParse(await fetchCurrentUser(baseUrl, accessToken));

  if (!user.success) {
    throw new AuthError('학생·선생님 계정으로만 로그인할 수 있습니다.');
  }

  const session: AppSession = { accessToken, expiresAt, user: user.data };
  await storeAppSession(session);
  return session;
}

/** 저장된 세션을 읽어 스토어에 반영한다. 만료됐으면 지우고 null. */
async function restoreSession(): Promise<AppSession | null> {
  try {
    const session = await readStoredAppSession();

    if (!session || session.expiresAt <= Date.now()) {
      if (session) {
        await clearStoredAppSession();
      }
      useAuthStore.getState().clear();
      return null;
    }

    useAuthStore.getState().setUser(session.user);
    return session;
  } catch (error) {
    useAuthStore.getState().setStatus('unauthenticated');
    useAuthStore.getState().setError(getErrorMessage(error));
    throw error;
  }
}

/**
 * 학생·선생님 공통 Google 로그인. 역할은 백엔드가 Google 계정으로 판별하며,
 * 처음 로그인하는 계정은 백엔드가 자동으로 가입시킨다. 사용자가 취소하면 false.
 */
export async function loginWithGoogle(): Promise<boolean> {
  const { status, user } = useAuthStore.getState();
  useAuthStore.getState().setStatus('loading');
  useAuthStore.getState().setError(null);

  try {
    const code = await requestGoogleAuthCode();

    if (code === null) {
      useAuthStore.setState({ status, user });
      return false;
    }

    const session = await createSession(code);
    useAuthStore.getState().setUser(session.user);
    return true;
  } catch (error) {
    useAuthStore.setState({ status, user, error: getErrorMessage(error) });
    throw error;
  }
}

export async function initializeAuthSession(): Promise<void> {
  useAuthStore.getState().setStatus('initializing');
  await restoreSession();
}

export async function getAppAccessToken(): Promise<string | null> {
  const session = await restoreSession();
  return session?.accessToken ?? null;
}

export async function logout(): Promise<void> {
  try {
    await clearStoredAppSession();
    useAuthStore.getState().clear();
  } catch (error) {
    useAuthStore.getState().setError(getErrorMessage(error));
    throw error;
  }
}
