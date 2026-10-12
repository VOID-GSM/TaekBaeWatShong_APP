import * as SecureStore from 'expo-secure-store';

import { authenticateDataGsmUser } from '../app-auth-api';

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
}));

const fetchMock = jest.fn((_input: RequestInfo | URL, _init?: RequestInit) =>
  Promise.resolve(new Response()),
);

describe('app authentication API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_API_URL = 'https://api.example.test/';
    globalThis.fetch = fetchMock;
  });

  afterEach(() => {
    delete process.env.EXPO_PUBLIC_API_URL;
  });

  it('accepts DataGSM tokens only for the matching student or teacher role', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          accessToken: 'student-session-token',
          expiresIn: 3600,
          user: { id: 'student-1', name: '학생', role: 'STUDENT' },
        }),
        { status: 200 },
      ),
    );

    const session = await authenticateDataGsmUser('datagsm-access-token', 'STUDENT');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/auth/datagsm',
      expect.objectContaining({
        body: JSON.stringify({ accessToken: 'datagsm-access-token' }),
      }),
    );
    expect(session.user.role).toBe('STUDENT');
  });

  it('accepts a teacher role returned for the DataGSM teacher account', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          accessToken: 'teacher-session-token',
          expiresIn: 3600,
          user: { id: 'teacher-1', name: '선생님', role: 'TEACHER' },
        }),
        { status: 200 },
      ),
    );

    const session = await authenticateDataGsmUser('datagsm-access-token', 'TEACHER');

    expect(session.user.role).toBe('TEACHER');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'taekbaewatshong.auth.session',
      expect.stringContaining('teacher-session-token'),
    );
  });

  it('rejects a backend role that does not match the DataGSM account role', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          accessToken: 'wrong-role-token',
          expiresIn: 3600,
          user: { id: 'teacher-1', name: '선생님', role: 'TEACHER' },
        }),
        { status: 200 },
      ),
    );

    await expect(authenticateDataGsmUser('datagsm-access-token', 'STUDENT')).rejects.toThrow(
      '이 로그인 방식으로는 해당 계정 유형을 사용할 수 없습니다.',
    );
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  });
});
