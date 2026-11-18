import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';

import {
  getAppAccessToken,
  initializeAuthSession,
  loginWithDataGsm,
  logout,
  readAppAccessToken,
} from '../auth';
import { useAuthStore } from '../auth-store';

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

const SESSION_KEY = 'taekbaewatshong.auth.session';
const EXPIRES_AT_SECONDS = Math.floor(Date.now() / 1000) + 3600;

function createJwt(exp: number): string {
  const encode = (value: object) =>
    btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${encode({ alg: 'HS256' })}.${encode({ sub: '1', exp })}.signature`;
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
    url: `taekbaewatshong://oauth2/redirect?${query}`,
  });
}

describe('client DataGSM login', () => {
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
    useAuthStore.setState({ status: 'unauthenticated', user: null, error: null });
  });

  afterEach(async () => {
    // 로그인한 테스트가 남긴 만료 타이머를 정리한다.
    await logout();
    delete process.env.EXPO_PUBLIC_API_URL;
  });

  it.each(['STUDENT', 'TEACHER'] as const)('logs in a %s account', async (role) => {
    const token = createJwt(EXPIRES_AT_SECONDS);
    const user = { id: 1, email: 's25048@gsm.hs.kr', name: '홍길동', role };
    mockCallback('code=one-time-code');
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ token }))
      .mockResolvedValueOnce(jsonResponse(user));

    await expect(loginWithDataGsm()).resolves.toBe(true);

    expect(WebBrowser.openAuthSessionAsync).toHaveBeenCalledWith(
      'https://api.example.test/auth/login?provider=datagsm',
      'taekbaewatshong://oauth2/redirect',
    );
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'https://api.example.test/auth/token?code=one-time-code',
    );
    expect(fetchMock.mock.calls[1]).toEqual([
      'https://api.example.test/api/users/me',
      { headers: { Authorization: `Bearer ${token}` } },
    ]);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      SESSION_KEY,
      JSON.stringify({ accessToken: token, expiresAt: EXPIRES_AT_SECONDS * 1000, user }),
    );
    expect(useAuthStore.getState()).toMatchObject({ status: 'authenticated', user });
  });

  it('returns false without touching the session when the user cancels', async () => {
    jest.mocked(WebBrowser.openAuthSessionAsync).mockResolvedValue({
      type: 'cancel' as WebBrowser.WebBrowserResultType,
    });

    await expect(loginWithDataGsm()).resolves.toBe(false);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(useAuthStore.getState().status).toBe('unauthenticated');
  });

  it('surfaces the error the backend puts on the callback', async () => {
    const message = '이 DataGSM 계정으로는 로그인할 수 없습니다';
    mockCallback(`error=${encodeURIComponent(message)}`);

    await expect(loginWithDataGsm()).rejects.toThrow(message);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(useAuthStore.getState()).toMatchObject({ status: 'unauthenticated', error: message });
  });

  it('rejects an ADMIN account and never stores its session', async () => {
    mockCallback('code=one-time-code');
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ token: createJwt(EXPIRES_AT_SECONDS) }))
      .mockResolvedValueOnce(
        jsonResponse({ id: 9, email: 'driver@example.test', name: '기사', role: 'ADMIN' }),
      );

    await expect(loginWithDataGsm()).rejects.toThrow('학생·선생님 계정으로만');
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  });

  it('drops an expired stored session', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue(
      JSON.stringify({
        accessToken: 'expired',
        expiresAt: Date.now() - 1000,
        user: { id: 1, email: 's25048@gsm.hs.kr', name: '홍길동', role: 'STUDENT' },
      }),
    );

    await expect(getAppAccessToken()).resolves.toBeNull();

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(SESSION_KEY);
    expect(useAuthStore.getState().status).toBe('unauthenticated');
  });

  it('clears the stored session on logout', async () => {
    useAuthStore.setState({ status: 'authenticated' });

    await logout();

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(SESSION_KEY);
    expect(useAuthStore.getState()).toMatchObject({ status: 'unauthenticated', user: null });
  });

  it('keeps the stored session when SecureStore cannot be read', async () => {
    jest.mocked(SecureStore.getItemAsync).mockRejectedValue(new Error('Keychain is locked'));

    await expect(initializeAuthSession()).resolves.toBeUndefined();

    expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
    expect(useAuthStore.getState()).toMatchObject({ status: 'unauthenticated', error: null });
  });

  it('discards a corrupted stored session without showing an error', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue('{not json');

    await expect(initializeAuthSession()).resolves.toBeUndefined();

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(SESSION_KEY);
    expect(useAuthStore.getState()).toMatchObject({ status: 'unauthenticated', error: null });
  });

  it('signs out when the restored token expires', async () => {
    jest.useFakeTimers();
    try {
      jest.mocked(SecureStore.getItemAsync).mockResolvedValue(
        JSON.stringify({
          accessToken: 'token',
          expiresAt: Date.now() + 60_000,
          user: { id: 1, email: 's25048@gsm.hs.kr', name: '홍길동', role: 'STUDENT' },
        }),
      );

      await initializeAuthSession();
      expect(useAuthStore.getState().status).toBe('authenticated');

      await jest.advanceTimersByTimeAsync(60_000);

      expect(useAuthStore.getState()).toMatchObject({ status: 'unauthenticated', user: null });
    } finally {
      jest.useRealTimers();
    }
  });

  describe('readAppAccessToken', () => {
    async function login(): Promise<string> {
      const token = createJwt(EXPIRES_AT_SECONDS);
      mockCallback('code=one-time-code');
      fetchMock
        .mockResolvedValueOnce(jsonResponse({ token }))
        .mockResolvedValueOnce(
          jsonResponse({ id: 1, email: 's25048@gsm.hs.kr', name: '홍길동', role: 'STUDENT' }),
        );
      await loginWithDataGsm();
      return token;
    }

    it('reads the token from memory without touching SecureStore', async () => {
      const token = await login();

      await expect(readAppAccessToken()).resolves.toBe(token);
      expect(SecureStore.getItemAsync).not.toHaveBeenCalled();
    });

    it('throws a session expired error once the token has expired', async () => {
      await login();
      jest.spyOn(Date, 'now').mockReturnValue(EXPIRES_AT_SECONDS * 1000 + 1);

      await expect(readAppAccessToken()).rejects.toMatchObject({ status: 401 });
      jest.mocked(Date.now).mockRestore();
    });

    it('returns null after logout', async () => {
      await login();
      await logout();

      await expect(readAppAccessToken()).resolves.toBeNull();
    });
  });
});
