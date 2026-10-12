import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { z } from 'zod';

import { AuthenticationError } from './app-auth-api';

const AUTHORIZATION_ENDPOINT = 'https://oauth.authorization.datagsm.kr/v1/oauth/authorize';
const TOKEN_ENDPOINT = 'https://oauth.authorization.datagsm.kr/v1/oauth/token';
const USER_INFO_ENDPOINT = 'https://oauth.resource.datagsm.kr/userinfo';
const REDIRECT_URI = Linking.createURL('oauth', { scheme: 'taekbaewatshong' });

const dataGsmUserSchema = z.object({
  objectType: z.enum(['STUDENT', 'TEACHER']),
  student: z
    .object({ name: z.string().min(1) })
    .passthrough()
    .nullable(),
  teacher: z
    .object({ name: z.string().min(1) })
    .passthrough()
    .nullable(),
});

const tokenResponseSchema = z.object({
  access_token: z.string().min(1),
});

export interface DataGsmIdentity {
  accessToken: string;
  role: 'STUDENT' | 'TEACHER';
}

function getClientId(): string {
  const clientId = process.env.EXPO_PUBLIC_DATAGSM_CLIENT_ID?.trim();

  if (!clientId) {
    throw new AuthenticationError('EXPO_PUBLIC_DATAGSM_CLIENT_ID 환경 변수를 설정해야 합니다.');
  }

  return clientId;
}

function randomHex(byteCount: number): string {
  return Array.from(Crypto.getRandomBytes(byteCount), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}

async function createCodeChallenge(codeVerifier: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, codeVerifier, {
    encoding: Crypto.CryptoEncoding.BASE64,
  });

  return digest.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new AuthenticationError(
      'DataGSM 서버가 올바르지 않은 응답을 반환했습니다.',
      response.status,
    );
  }
}

async function exchangeCode(code: string, clientId: string, codeVerifier: string): Promise<string> {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier,
    }),
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw new AuthenticationError(
      `DataGSM 토큰 요청에 실패했습니다. (HTTP ${response.status})`,
      response.status,
    );
  }

  const parsed = tokenResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new AuthenticationError('DataGSM 토큰 응답 형식이 올바르지 않습니다.', response.status);
  }

  return parsed.data.access_token;
}

async function readDataGsmIdentity(accessToken: string): Promise<DataGsmIdentity> {
  const response = await fetch(USER_INFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw new AuthenticationError(
      `DataGSM 사용자 정보를 가져오지 못했습니다. (HTTP ${response.status})`,
      response.status,
    );
  }

  const parsed = dataGsmUserSchema.safeParse(payload);

  if (!parsed.success) {
    throw new AuthenticationError(
      'DataGSM 사용자 정보 응답 형식이 올바르지 않습니다.',
      response.status,
    );
  }

  const role = parsed.data.objectType;
  const name = role === 'STUDENT' ? parsed.data.student?.name : parsed.data.teacher?.name;

  if (!name) {
    throw new AuthenticationError('DataGSM 학생·선생님 계정 정보를 확인할 수 없습니다.');
  }

  return { accessToken, role };
}

export async function signInWithDataGsm(): Promise<DataGsmIdentity | null> {
  const clientId = getClientId();
  const state = randomHex(32);
  const codeVerifier = randomHex(32);
  const codeChallenge = await createCodeChallenge(codeVerifier);
  const authorizationUrl = new URL(AUTHORIZATION_ENDPOINT);

  authorizationUrl.searchParams.set('client_id', clientId);
  authorizationUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authorizationUrl.searchParams.set('response_type', 'code');
  authorizationUrl.searchParams.set('state', state);
  authorizationUrl.searchParams.set('code_challenge', codeChallenge);
  authorizationUrl.searchParams.set('code_challenge_method', 'S256');

  const result = await WebBrowser.openAuthSessionAsync(authorizationUrl.toString(), REDIRECT_URI);

  if (result.type === 'cancel' || result.type === 'dismiss') {
    return null;
  }

  if (result.type !== 'success') {
    throw new AuthenticationError(`DataGSM 인증 브라우저를 열지 못했습니다. (${result.type})`);
  }

  const params = Linking.parse(result.url).queryParams ?? {};

  if (params.state !== state) {
    throw new AuthenticationError('OAuth state 검증에 실패했습니다. 로그인을 다시 시도해 주세요.');
  }

  if (typeof params.error === 'string') {
    throw new AuthenticationError(
      typeof params.error_description === 'string'
        ? params.error_description
        : `DataGSM 인증에 실패했습니다. (${params.error})`,
    );
  }

  if (typeof params.code !== 'string' || !params.code) {
    throw new AuthenticationError('DataGSM 로그인 콜백에 인증 코드가 없습니다.');
  }

  const accessToken = await exchangeCode(params.code, clientId, codeVerifier);
  return readDataGsmIdentity(accessToken);
}
