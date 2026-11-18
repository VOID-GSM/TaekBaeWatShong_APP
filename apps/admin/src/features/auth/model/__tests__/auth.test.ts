import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';

import { initializeAdminAuthSession, loginAdmin, logoutAdmin, readAdminAccessToken } from '../auth';
import { useAdminAuthStore } from '../auth-store';

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-linking', () => ({
  parse: jest.fn(),
}));

jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: jest.fn(),
}));

const SESSION_KEY = 'taekbaewatshong.admin.auth.session';
const EXPIRES_AT_SECONDS = Math.floor(Date.now() / 1000) + 3600;

function createJwt(exp: number): string {
  const encode = (value: object) =>
    btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${encode({ alg: 'HS256' })}.${encode({ sub: '7', exp })}.signature`;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

const fetchMock = jest.fn((_input: RequestInfo | URL, _init?: RequestInit) =>
  Promise.resolve(new Response()),
);

function mockCallback(query: string): void {
  jest.mocked(WebBrowser.openAuthSessionAsync).mockResolvedValue({
    type: 'success',
    url: `taekbaewatshong-admin://oauth2/redirect?${query}`,
  });
}

describe('admin sign-up and login', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.mocked(Linking.parse).mockImplementation((url) => ({
      scheme: null,
      hostname: null,
      path: null,
      queryParams: Object.fromEntries(new URL(url).searchParams),
    }));
    process.env.EXPO_PUBLIC_API_URL = 'https://api.example.test/';
    globalThis.fetch = fetchMock;
    useAdminAuthStore.setState({ status: 'unauthenticated', user: null, error: null });
  });

  afterEach(() => {
    delete process.env.EXPO_PUBLIC_API_URL;
  });

  it.each(['datagsm', 'google'] as const)(
    'opens the admin %s login and stores the ADMIN session',
    async (provider) => {
      const token = createJwt(EXPIRES_AT_SECONDS);
      const user = { id: 7, email: 'driver@example.test', name: '택배기사', role: 'ADMIN' };
      mockCallback('code=one-time-code');
      fetchMock
        .mockResolvedValueOnce(jsonResponse({ token }))
        .mockResolvedValueOnce(jsonResponse(user));

      await expect(loginAdmin(provider)).resolves.toBe(true);

      expect(WebBrowser.openAuthSessionAsync).toHaveBeenCalledWith(
        `https://api.example.test/auth/admin/login?provider=${provider}`,
        'taekbaewatshong-admin://oauth2/redirect',
      );
      expect(fetchMock.mock.calls[0]?.[0]).toBe(
        'https://api.example.test/auth/token?code=one-time-code',
      );
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        SESSION_KEY,
        JSON.stringify({ accessToken: token, expiresAt: EXPIRES_AT_SECONDS * 1000, user }),
      );
      expect(useAdminAuthStore.getState()).toMatchObject({ status: 'authenticated', user });
    },
  );

  it('surfaces the backend rejection for an account that is not allowed', async () => {
    const message = '관리자 계정이 아닙니다';
    mockCallback(`error=${encodeURIComponent(message)}`);

    await expect(loginAdmin('datagsm')).rejects.toThrow(message);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(useAdminAuthStore.getState()).toMatchObject({
      status: 'unauthenticated',
      error: message,
    });
  });

  it('rejects a non-admin account and never stores its session', async () => {
    mockCallback('code=one-time-code');
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ token: createJwt(EXPIRES_AT_SECONDS) }))
      .mockResolvedValueOnce(
        jsonResponse({ id: 3, email: 's25048@gsm.hs.kr', name: '학생', role: 'STUDENT' }),
      );

    await expect(loginAdmin('datagsm')).rejects.toThrow('관리자 계정으로만');
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  });

  it('returns false when the user cancels', async () => {
    jest.mocked(WebBrowser.openAuthSessionAsync).mockResolvedValue({
      type: 'cancel' as WebBrowser.WebBrowserResultType,
    });

    await expect(loginAdmin('google')).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('clears the stored session on logout', async () => {
    useAdminAuthStore.setState({ status: 'authenticated' });

    await logoutAdmin();

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(SESSION_KEY);
    expect(useAdminAuthStore.getState()).toMatchObject({ status: 'unauthenticated', user: null });
  });

  it('discards a corrupted stored session without showing an error', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue('{not json');

    await expect(initializeAdminAuthSession()).resolves.toBeUndefined();

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(SESSION_KEY);
    expect(useAdminAuthStore.getState()).toMatchObject({ status: 'unauthenticated', error: null });
  });

  it('signs out when the restored token expires', async () => {
    jest.useFakeTimers();
    try {
      jest.mocked(SecureStore.getItemAsync).mockResolvedValue(
        JSON.stringify({
          accessToken: 'token',
          expiresAt: Date.now() + 60_000,
          user: { id: 1, email: 'admin@example.test', name: '홍길동', role: 'ADMIN' },
        }),
      );

      await initializeAdminAuthSession();
      expect(useAdminAuthStore.getState().status).toBe('authenticated');

      await jest.advanceTimersByTimeAsync(60_000);

      expect(useAdminAuthStore.getState()).toMatchObject({ status: 'unauthenticated', user: null });
    } finally {
      jest.useRealTimers();
    }
  });

  describe('readAdminAccessToken', () => {
    async function login(): Promise<string> {
      const token = createJwt(EXPIRES_AT_SECONDS);
      mockCallback('code=one-time-code');
      fetchMock
        .mockResolvedValueOnce(jsonResponse({ token }))
        .mockResolvedValueOnce(
          jsonResponse({ id: 7, email: 'driver@example.test', name: '택배기사', role: 'ADMIN' }),
        );
      await loginAdmin('google');
      return token;
    }

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('로그인한 세션의 토큰을 저장소를 다시 읽지 않고 돌려준다', async () => {
      const token = await login();
      jest.mocked(SecureStore.getItemAsync).mockClear();

      await expect(readAdminAccessToken()).resolves.toBe(token);
      expect(SecureStore.getItemAsync).not.toHaveBeenCalled();
    });

    it('로그아웃하면 토큰을 돌려주지 않는다', async () => {
      await login();
      await logoutAdmin();

      await expect(readAdminAccessToken()).resolves.toBeNull();
    });

    it('만료된 세션이면 요청 전에 세션 만료 에러를 던진다', async () => {
      await login();
      jest.spyOn(Date, 'now').mockReturnValue((EXPIRES_AT_SECONDS + 1) * 1000);

      await expect(readAdminAccessToken()).rejects.toMatchObject({ status: 401 });
    });
  });
});
