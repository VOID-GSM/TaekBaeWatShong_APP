import axios, { type AxiosError, AxiosHeaders, type AxiosInstance } from 'axios';

export interface ApiConfig {
  baseURL: string;
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

let instance: AxiosInstance | null = null;

export function configureApi(config: ApiConfig) {
  instance = axios.create({ baseURL: config.baseURL, timeout: 10_000 });

  instance.interceptors.request.use(async (req) => {
    const token = await config.getAccessToken();
    if (token) req.headers.Authorization = `Bearer ${token}`;
    return req;
  });

  instance.interceptors.response.use(
    (res) => {
      // 서버는 토큰이 없거나 만료되면 401 대신 302 로 로그인 페이지(HTML)를 돌려준다.
      // 리다이렉트를 따라간 200 HTML 응답은 인증 실패로 본다.
      if (isHtmlResponse(res.headers)) {
        config.onUnauthorized?.();
        return Promise.reject(new ApiError('로그인이 만료되었습니다. 다시 로그인해 주세요.', 401));
      }
      return res;
    },
    (error: AxiosError<unknown>) => {
      const status = error.response?.status;
      if (status === 401) config.onUnauthorized?.();
      const body = readErrorBody(error.response?.data);
      return Promise.reject(new ApiError(getErrorMessage(error, body), status, body.code));
    },
  );
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
