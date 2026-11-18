import {
  AuthError,
  createExpiryTimer,
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

function getErrorMessage(error: unknown): string {
  return error instanceof AuthError
    ? error.message
    : '로그인 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.';
}

const LOGOUT_ERROR_MESSAGE = '로그아웃 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.';

// 백엔드에 토큰 갱신 API 가 없어, 만료 시각에 로그아웃해 가드가 로그인 화면으로 보내게 한다.
// 저장소를 다시 읽지 않고 메모리의 만료 시각만 보므로 로그아웃과 경합하지 않는다.
const sessionExpiry = createExpiryTimer(() => void logout().catch(() => {}));

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
      sessionExpiry.cancel();
      if (session) {
        await clearStoredAppSession();
      }
      useAuthStore.getState().clear();
      return null;
    }

    currentSession = session;
    useAuthStore.getState().setUser(session.user);
    sessionExpiry.schedule(session.expiresAt);
    return session;
  } catch {
    // 저장소 읽기 실패(예: 기기가 잠겨 Keychain 에 접근할 수 없음)는 일시적일 수 있어 저장값은 남기고 로그아웃 상태로만 둔다.
    // 손상된 저장값은 readStoredAppSession 이 지우고 null 을 돌려준다.
    currentSession = null;
    sessionExpiry.cancel();
    useAuthStore.getState().clear();
    return null;
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
    sessionExpiry.schedule(session.expiresAt);
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
  currentSession = null;
  sessionExpiry.cancel();

  try {
    await clearStoredAppSession();
    useAuthStore.getState().clear();
  } catch (error) {
    useAuthStore.getState().setError(LOGOUT_ERROR_MESSAGE);
    throw error;
  }
}
