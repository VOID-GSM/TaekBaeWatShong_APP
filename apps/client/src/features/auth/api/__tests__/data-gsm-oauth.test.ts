import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';

import { signInWithDataGsm } from '../data-gsm-oauth';

jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  CryptoEncoding: { BASE64: 'base64' },
  digestStringAsync: jest.fn(),
  getRandomBytes: jest.fn(),
}));

jest.mock('expo-linking', () => ({
  createURL: jest.fn(() => 'taekbaewatshong://oauth'),
  parse: jest.fn((url: string) => {
    const parsed = new URL(url);

    return {
      scheme: parsed.protocol.replace(':', ''),
      hostname: parsed.hostname,
      path: parsed.pathname,
      queryParams: Object.fromEntries(parsed.searchParams),
    };
  }),
}));

jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: jest.fn(),
}));

const fetchMock = jest.fn((_input: RequestInfo | URL, _init?: RequestInit) =>
  Promise.resolve(new Response()),
);

describe('DataGSM OAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_DATAGSM_CLIENT_ID = 'datagsm-client-id';
    jest.mocked(Crypto.getRandomBytes).mockReturnValue(new Uint8Array(32).fill(15));
    jest.mocked(Crypto.digestStringAsync).mockResolvedValue('AAAA+/==');
    globalThis.fetch = fetchMock;
  });

  afterEach(() => {
    delete process.env.EXPO_PUBLIC_DATAGSM_CLIENT_ID;
  });

  it.each([
    { role: 'STUDENT' as const, user: { student: { name: '학생' }, teacher: null } },
    { role: 'TEACHER' as const, user: { student: null, teacher: { name: '선생님' } } },
  ])('authenticates a DataGSM $role account', async ({ role, user }) => {
    jest.mocked(WebBrowser.openAuthSessionAsync).mockImplementation(async (url, redirectUri) => ({
      type: 'success',
      url: `${redirectUri}?code=auth-code&state=${new URL(url).searchParams.get('state')}`,
    }));
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: 'datagsm-access-token' }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ objectType: role, ...user }), { status: 200 }),
      );

    const identity = await signInWithDataGsm();
    const tokenRequest = fetchMock.mock.calls[0]?.[1];

    expect(identity).toEqual({ accessToken: 'datagsm-access-token', role });
    expect(JSON.parse(String(tokenRequest?.body))).toMatchObject({
      grant_type: 'authorization_code',
      code: 'auth-code',
      client_id: 'datagsm-client-id',
      code_verifier: '0f'.repeat(32),
    });
  });

  it('rejects an OAuth callback when state does not match', async () => {
    jest.mocked(WebBrowser.openAuthSessionAsync).mockImplementation(async (_, redirectUri) => ({
      type: 'success',
      url: `${redirectUri}?code=auth-code&state=incorrect`,
    }));

    await expect(signInWithDataGsm()).rejects.toThrow('OAuth state 검증에 실패했습니다.');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
