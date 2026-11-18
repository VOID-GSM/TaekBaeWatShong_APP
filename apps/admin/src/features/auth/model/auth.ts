import {
  AuthError,
  createSessionExpiredError,
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

/** API 요청마다 SecureStore 를 읽지 않도록 로그인·복원한 세션을 메모리에 둔다. */
let currentSession: AdminSession | null = null;

function getErrorMessage(error: unknown): string {
  return error instanceof AuthError
    ? error.message
    : '로그인 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.';
}

// setTimeout 은 32비트 정수 밀리초까지만 받는다.
const MAX_TIMER_DELAY = 2 ** 31 - 1;
let expiryTimer: ReturnType<typeof setTimeout> | null = null;

function cancelSessionExpiry(): void {
  if (expiryTimer !== null) {
    clearTimeout(expiryTimer);
    expiryTimer = null;
  }
}

// 백엔드에 토큰 갱신 API 가 없어, 만료 시각에 세션을 지워 가드가 로그인 화면으로 보내게 한다.
function scheduleSessionExpiry(expiresAt: number): void {
  cancelSessionExpiry();
  expiryTimer = setTimeout(
    () => {
      expiryTimer = null;
      void restoreSession();
    },
    Math.min(Math.max(expiresAt - Date.now(), 0), MAX_TIMER_DELAY),
  );
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
  currentSession = session;
  return session;
}

async function restoreSession(): Promise<AdminSession | null> {
  try {
    const session = await readStoredAdminSession();

    if (!session || session.expiresAt <= Date.now()) {
      currentSession = null;
      cancelSessionExpiry();
      if (session) {
        await clearStoredAdminSession();
      }
      useAdminAuthStore.getState().clear();
      return null;
    }

    currentSession = session;
    useAdminAuthStore.getState().setUser(session.user);
    scheduleSessionExpiry(session.expiresAt);
    return session;
  } catch {
    // 손상된 저장값은 다시 로그인하기 전까지 매번 실패하므로 지우고 로그아웃 상태로 둔다.
    currentSession = null;
    cancelSessionExpiry();
    await clearStoredAdminSession().catch(() => {});
    useAdminAuthStore.getState().clear();
    return null;
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
    scheduleSessionExpiry(session.expiresAt);
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

/**
 * API 요청에 붙일 토큰. 메모리 세션만 읽어 요청마다 저장소를 열지 않는다.
 * 만료됐으면 요청을 보내기 전에 막도록 세션 만료 에러를 던진다(`configureApi` 가 로그아웃시킨다).
 */
export async function readAdminAccessToken(): Promise<string | null> {
  if (currentSession === null) return null;
  if (currentSession.expiresAt <= Date.now()) throw createSessionExpiredError();
  return currentSession.accessToken;
}

export async function logoutAdmin(): Promise<void> {
  currentSession = null;
  cancelSessionExpiry();

  try {
    await clearStoredAdminSession();
    useAdminAuthStore.getState().clear();
  } catch (error) {
    useAdminAuthStore.getState().setError(getErrorMessage(error));
    throw error;
  }
}
