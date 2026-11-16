import axios, {
  type AxiosError,
  AxiosHeaders,
  type AxiosInstance,
  type AxiosResponse,
} from 'axios';

export interface ApiConfig {
  baseURL: string;
  /** 요청에 붙일 토큰. 세션이 만료됐으면 `createSessionExpiredError()` 를 던져 요청 전에 막는다. */
  getAccessToken: () => Promise<string | null>;
  /** 401 이 났을 때 앱이 할 일 (토큰 삭제, 로그인 화면 이동 등) */
  onUnauthorized?: () => void;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** 로그인 만료 에러. 요청 전 만료 확인과 서버의 로그인 리다이렉트 응답이 같은 에러를 쓴다. */
export function createSessionExpiredError(): ApiError {
  return new ApiError('로그인이 만료되었습니다. 다시 로그인해 주세요.', 401);
}

let instance: AxiosInstance | null = null;

export function configureApi(config: ApiConfig) {
  instance = axios.create({ baseURL: config.baseURL, timeout: 10_000 });

  instance.interceptors.request.use(async (req) => {
    let token: string | null;
    try {
      token = await config.getAccessToken();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) config.onUnauthorized?.();
      throw error;
    }
    if (token) req.headers.Authorization = `Bearer ${token}`;
    return req;
  });

  instance.interceptors.response.use(
    (res) => {
      // 서버는 인증 실패 시 401 대신 302 로 로그인 페이지(HTML)를 돌려준다.
      // 캡티브 포털·프록시 오류 페이지 같은 다른 HTML 은 로그아웃 사유가 아니므로, 최종 주소가 /login 일 때만 인증 실패로 본다.
      if (isLoginRedirect(res)) {
        config.onUnauthorized?.();
        return Promise.reject(createSessionExpiredError());
      }
      return res;
    },
    (error: AxiosError<unknown> | ApiError) => {
      // 요청 인터셉터가 던진 에러(세션 만료)도 이 핸들러를 거친다 — 이미 정규화된 에러는 그대로 넘긴다.
      if (error instanceof ApiError) return Promise.reject(error);
      const status = error.response?.status;
      if (status === 401) config.onUnauthorized?.();
      const body = readErrorBody(error.response?.data);
      return Promise.reject(new ApiError(getErrorMessage(error, body), status, body.code));
    },
  );
}

function isLoginRedirect(res: AxiosResponse): boolean {
  if (!isHtmlResponse(res.headers)) return false;
  const responseURL = (res.request as { responseURL?: unknown } | undefined)?.responseURL;
  // RN 의 URL 폴리필은 pathname 을 지원하지 않아 문자열로 본다. 쿼리·해시를 떼고 경로 끝이 /login 인지 확인.
  return typeof responseURL === 'string' && /^[^?#]*\/login\/?(?:[?#]|$)/.test(responseURL);
}

function isHtmlResponse(headers: unknown): boolean {
  const contentType =
    headers instanceof AxiosHeaders
      ? headers.getContentType()
      : (headers as Record<string, unknown> | undefined)?.['content-type'];
  return typeof contentType === 'string' && contentType.includes('text/html');
}

function readErrorBody(data: unknown): { message?: string; code?: string } {
  if (typeof data !== 'object' || data === null) return {};
  const { message, code } = data as Record<string, unknown>;
  return {
    message: typeof message === 'string' && message.trim() ? message : undefined,
    code: typeof code === 'string' ? code : undefined,
  };
}

function getErrorMessage(error: AxiosError, body: { message?: string }): string {
  if (body.message) return body.message;
  if (error.response) return `요청을 처리하지 못했습니다. (HTTP ${error.response.status})`;
  if (error.code === 'ECONNABORTED') return '요청 시간이 초과되었습니다.';
  return '네트워크 오류가 발생했습니다.';
}

interface ResponseSchema<T> {
  safeParse(data: unknown): { success: true; data: T } | { success: false };
}

/** 응답을 스키마로 검증한다. 스펙이 다르면 화면이 아니라 여기서 `ApiError` 로 실패한다. */
export function parseResponse<T>(schema: ResponseSchema<T>, data: unknown): T {
  const parsed = schema.safeParse(data);
  if (!parsed.success) throw new ApiError('서버 응답 형식이 올바르지 않습니다.');
  return parsed.data;
}

export function api(): AxiosInstance {
  if (!instance) throw new ApiError('configureApi() 가 먼저 호출되어야 합니다.');
  return instance;
}
