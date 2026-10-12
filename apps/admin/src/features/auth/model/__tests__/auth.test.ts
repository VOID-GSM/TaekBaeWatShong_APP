import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';

import { loginAdminWithGoogle, logoutAdmin } from '../auth';
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

describe('admin Google sign-up and login', () => {
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

  it('opens the admin Google login and stores the ADMIN session', async () => {
    const token = createJwt(EXPIRES_AT_SECONDS);
    const user = { id: 7, email: 'driver@example.test', name: '택배기사', role: 'ADMIN' };
    mockCallback('code=one-time-code');
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ token }))
      .mockResolvedValueOnce(jsonResponse(user));

    await expect(loginAdminWithGoogle()).resolves.toBe(true);

    expect(WebBrowser.openAuthSessionAsync).toHaveBeenCalledWith(
      'https://api.example.test/auth/admin/login?provider=google',
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
  });

  it('surfaces the backend rejection for a Google account that is not allowed', async () => {
    const message = '관리자 계정이 아닙니다';
    mockCallback(`error=${encodeURIComponent(message)}`);

    await expect(loginAdminWithGoogle()).rejects.toThrow(message);

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

    await expect(loginAdminWithGoogle()).rejects.toThrow('택배기사(관리자) 계정으로만');
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  });

  it('returns false when the user cancels', async () => {
    jest.mocked(WebBrowser.openAuthSessionAsync).mockResolvedValue({
      type: 'cancel' as WebBrowser.WebBrowserResultType,
    });

    await expect(loginAdminWithGoogle()).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('clears the stored session on logout', async () => {
    useAdminAuthStore.setState({ status: 'authenticated' });

    await logoutAdmin();

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(SESSION_KEY);
    expect(useAdminAuthStore.getState()).toMatchObject({ status: 'unauthenticated', user: null });
  });
});
