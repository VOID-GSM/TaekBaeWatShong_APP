import * as SecureStore from 'expo-secure-store';

import { authenticateAdmin } from '../admin-auth-api';

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
}));

const fetchMock = jest.fn((_input: RequestInfo | URL, _init?: RequestInit) =>
  Promise.resolve(new Response()),
);

describe('admin Google authentication API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_API_URL = 'https://api.example.test/';
    globalThis.fetch = fetchMock;
  });

  afterEach(() => {
    delete process.env.EXPO_PUBLIC_API_URL;
  });

  it('sends the Google ID token to the admin API and stores an ADMIN session', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          accessToken: 'admin-access-token',
          expiresIn: 3600,
          user: { id: 7, name: '관리자', role: 'ADMIN' },
        }),
        { status: 200 },
      ),
    );

    const session = await authenticateAdmin('google-id-token');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/auth/google',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ idToken: 'google-id-token' }),
      }),
    );
    expect(session.user.role).toBe('ADMIN');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'taekbaewatshong.admin.auth.session',
      expect.stringContaining('admin-access-token'),
    );
  });

  it('rejects non-admin accounts and never stores their app session', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          accessToken: 'student-access-token',
          expiresIn: 3600,
          user: { id: 3, name: '학생', role: 'STUDENT' },
        }),
        { status: 200 },
      ),
    );

    await expect(authenticateAdmin('google-id-token')).rejects.toThrow(
      '인증 서버가 관리자 계정 세션을 반환하지 않았습니다.',
    );
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  });
});
