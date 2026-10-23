import { AuthError, buildOAuthLoginUrl, resolveApiBaseUrl } from '@taekbae/api';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

export const OAUTH_REDIRECT_PATH = 'oauth2/redirect';

// 백엔드의 OAUTH2_REDIRECT_URI 와 정확히 같아야 한다.
const OAUTH_REDIRECT_URI = `taekbaewatshong://${OAUTH_REDIRECT_PATH}`;

export async function requestDataGsmAuthCode(): Promise<string | null> {
  const loginUrl = buildOAuthLoginUrl(resolveApiBaseUrl(process.env.EXPO_PUBLIC_API_URL), {
    audience: 'client',
    provider: 'datagsm',
  });
  const result = await WebBrowser.openAuthSessionAsync(loginUrl, OAUTH_REDIRECT_URI);

  if (result.type !== 'success') {
    return null;
  }

  const { code, error } = Linking.parse(result.url).queryParams ?? {};

  if (typeof error === 'string' && error) {
    throw new AuthError(error);
  }

  if (typeof code !== 'string' || !code) {
    throw new AuthError('로그인 콜백에 인증 코드가 없습니다.');
  }

  return code;
}
