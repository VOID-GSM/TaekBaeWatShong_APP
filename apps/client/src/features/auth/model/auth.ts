import {
  AuthError,
  createSessionExpiredError,
  exchangeAuthCode,
  fetchCurrentUser,
  readTokenExpiresAt,
  resolveApiBaseUrl,
} from '@taekbae/api';

import { appUserSchema } from '@/entities/user';

import { requestDataGsmAuthCode } from '../api/oauth-login';
import {
  type AppSession,
  clearStoredAppSession,
  readStoredAppSession,
  storeAppSession,
} from '../api/session-storage';
import { useAuthStore } from './auth-store';

/**
 * 메모리에 올려 둔 현재 세션. API 요청마다 SecureStore 를 읽지 않도록 로그인·복원·로그아웃 때만 갱신한다.
 */
let currentSession: AppSession | null = null;

/**
 * 로그아웃할 때 세션을 지우기 **전에** 할 정리 작업(예: 이 기기의 푸시 토큰 삭제).
 * 다른 기능(feature)을 직접 import 하지 않도록 앱 계층(app/providers)에서 주입한다.
 * 만료된 액세스 토큰이 넘어올 수 있다.
 */
type LogoutCleanup = (accessToken: string) => Promise<void>;
let logoutCleanup: LogoutCleanup | null = null;

export function setLogoutCleanup(cleanup: LogoutCleanup | null): void {
  logoutCleanup = cleanup;
}

/** 정리 작업은 실패해도 로그아웃을 막지 않는다. */
async function runLogoutCleanup(session: AppSession | null): Promise<void> {
  if (!session || !logoutCleanup) return;
  try {
    await logoutCleanup(session.accessToken);
  } catch {
    // 실패해도 로그아웃은 계속한다.
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof AuthError
    ? error.message
    : '로그인 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.';
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
  currentSession = session;
  return session;
}

async function restoreSession(): Promise<AppSession | null> {
  try {
    const session = await readStoredAppSession();

    if (!session || session.expiresAt <= Date.now()) {
      currentSession = null;
      if (session) {
        // 앱을 꺼 둔 사이 만료된 세션도 로그아웃과 같다 — 지우기 전에 정리 작업을 한다.
        await runLogoutCleanup(session);
        await clearStoredAppSession();
      }
      useAuthStore.getState().clear();
      return null;
    }

    currentSession = session;
    useAuthStore.getState().setUser(session.user);
    return session;
  } catch (error) {
    useAuthStore.getState().setStatus('unauthenticated');
    useAuthStore.getState().setError(getErrorMessage(error));
    throw error;
  }
}

export async function loginWithDataGsm(): Promise<boolean> {
  const { status, user } = useAuthStore.getState();
  useAuthStore.getState().setStatus('loading');
  useAuthStore.getState().setError(null);

  try {
    const code = await requestDataGsmAuthCode();

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

/**
 * API 요청마다 불린다 — 메모리의 세션만 읽는다.
 * 만료됐으면 토큰 없이 요청을 보내지 않도록 로그인 만료 에러를 던진다(API 클라이언트가 onUnauthorized 를 부른다).
 */
export async function readAppAccessToken(): Promise<string | null> {
  if (currentSession === null) return null;
  if (currentSession.expiresAt <= Date.now()) throw createSessionExpiredError();
  return currentSession.accessToken;
}

export async function logout(): Promise<void> {
  const session = currentSession;
  // 정리 작업을 기다리는 동안 다른 요청이 이 세션을 쓰지 않게 먼저 비운다.
  currentSession = null;
  await runLogoutCleanup(session);
  try {
    await clearStoredAppSession();
    useAuthStore.getState().clear();
  } catch (error) {
    useAuthStore.getState().setError(getErrorMessage(error));
    throw error;
  }
}
