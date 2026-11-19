import { tokenResponseSchema, type User, userSchema } from '@taekbae/types';

export type OAuthProvider = 'google' | 'datagsm';

export type OAuthLoginTarget = { audience: 'client' | 'admin'; provider: OAuthProvider };

export class AuthError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export function resolveApiBaseUrl(apiUrl: string | undefined): string {
  const trimmed = apiUrl?.trim().replace(/\/+$/, '');

  if (!trimmed) {
    throw new AuthError('EXPO_PUBLIC_API_URL 환경 변수를 설정해야 합니다.');
  }

  if (!/^https?:\/\/[^/\s]+/.test(trimmed)) {
    throw new AuthError('EXPO_PUBLIC_API_URL 값이 올바른 URL이 아닙니다.');
  }

  return trimmed;
}

export function buildOAuthLoginUrl(baseUrl: string, target: OAuthLoginTarget): string {
  const path = target.audience === 'admin' ? '/auth/admin/login' : '/auth/login';
  return `${baseUrl}${path}?provider=${encodeURIComponent(target.provider)}`;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new AuthError('인증 서버가 올바르지 않은 응답을 반환했습니다.', response.status);
  }
}

export async function exchangeAuthCode(baseUrl: string, code: string): Promise<string> {
  const response = await fetch(`${baseUrl}/auth/token?code=${encodeURIComponent(code)}`);

  if (!response.ok) {
    throw new AuthError(
      response.status === 401
        ? '로그인 코드가 만료되었습니다. 다시 로그인해 주세요.'
        : `로그인 토큰 발급에 실패했습니다. (HTTP ${response.status})`,
      response.status,
    );
  }

  const parsed = tokenResponseSchema.safeParse(await readJson(response));

  if (!parsed.success) {
    throw new AuthError('인증 서버 응답 형식이 올바르지 않습니다.', response.status);
  }

  return parsed.data.token;
}

export async function fetchCurrentUser(baseUrl: string, accessToken: string): Promise<User> {
  const response = await fetch(`${baseUrl}/api/users/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new AuthError(
      `사용자 정보를 가져오지 못했습니다. (HTTP ${response.status})`,
      response.status,
    );
  }

  const parsed = userSchema.safeParse(await readJson(response));

  if (!parsed.success) {
    throw new AuthError('사용자 정보 응답 형식이 올바르지 않습니다.', response.status);
  }

  return parsed.data;
}

/**
 * 백엔드는 만료 시각을 따로 내려주지 않으므로 JWT 의 `exp` 로 판단한다.
 * 서명은 서버만 검증할 수 있다 — 여기서 읽은 값은 만료된 토큰을 미리 버리는 용도로만 쓴다.
 */
export function readTokenExpiresAt(token: string): number | null {
  const payload = token.split('.')[1];

  if (!payload) {
    return null;
  }

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const claims: unknown = JSON.parse(atob(padded));

    if (typeof claims !== 'object' || claims === null || !('exp' in claims)) {
      return null;
    }

    return typeof claims.exp === 'number' ? claims.exp * 1000 : null;
  } catch {
    return null;
  }
}

// setTimeout 은 32비트 정수 밀리초까지만 받는다.
const MAX_TIMER_DELAY = 2 ** 31 - 1;

export interface ExpiryTimer {
  schedule: (expiresAt: number) => void;
  cancel: () => void;
}

/**
 * `expiresAt`(ms) 이 되면 `onExpire` 를 부르는 타이머. 다시 schedule 하면 이전 예약은 취소된다.
 * 남은 시간이 setTimeout 한도를 넘으면 중간에 깨어나 다시 건다.
 */
export function createExpiryTimer(onExpire: () => void): ExpiryTimer {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const cancel = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const schedule = (expiresAt: number) => {
    cancel();
    timer = setTimeout(
      () => {
        timer = null;
        if (Date.now() < expiresAt) {
          schedule(expiresAt);
        } else {
          onExpire();
        }
      },
      Math.min(Math.max(expiresAt - Date.now(), 0), MAX_TIMER_DELAY),
    );
  };

  return { schedule, cancel };
}
