import {
  ApiError,
  configureApi,
  createSessionExpiredError,
  fetchMyParcels,
  parcelKeys,
  useCreateReportMutation,
} from '@taekbae/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import axios, { type AxiosAdapter, AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { PropsWithChildren } from 'react';

// packages/api 에 jest 가 아직 없어 앱에서 공개 API 로 검증한다.
// 네트워크 대신 axios adapter 를 바꿔 끼운다.
const adapter = jest.fn<ReturnType<AxiosAdapter>, Parameters<AxiosAdapter>>();
// packages/api 가 default export 의 create 를 쓰므로 같은 객체의 원본을 잡아 둔다.
// eslint-disable-next-line import/no-named-as-default-member
const realCreate = axios.create.bind(axios);
jest.spyOn(axios, 'create').mockImplementation((config) => realCreate({ ...config, adapter }));

function respond(status: number, data: unknown) {
  adapter.mockImplementationOnce(async (config: InternalAxiosRequestConfig) => {
    const response = { data, status, statusText: '', headers: {}, config };
    if (status >= 400) {
      throw new AxiosError('error', undefined, config, undefined, response);
    }
    return response;
  });
}

const parcel = {
  id: 1,
  deliveryCompany: 'CJ대한통운',
  invoiceNumber: '604122378890',
  alias: '겨울 패딩',
  status: 'ARRIVED',
  unclaimedDays: 0,
  createdAt: '2026-07-05T09:00:00',
};

const report = {
  id: 3,
  invoiceNumber: '604122378890',
  alias: '겨울 패딩',
  lostEstimatedAt: '2026-07-06T15:30:00',
  content: '현관 앞에 없어요',
  progress: 'RECEIVED',
  createdAt: '2026-07-06T16:00:00',
};

const onUnauthorized = jest.fn();

beforeEach(() => {
  adapter.mockReset();
  onUnauthorized.mockReset();
  configureApi({
    baseURL: 'https://api.example.test',
    getAccessToken: async () => 'token-1',
    onUnauthorized,
  });
});

describe('fetchMyParcels', () => {
  it('GET /parcel/me 응답을 파싱해 배열을 돌려준다', async () => {
    respond(200, { parcels: [parcel] });

    await expect(fetchMyParcels({ status: 'ARRIVED' })).resolves.toEqual([parcel]);

    const config = adapter.mock.calls[0]?.[0];
    expect(config?.url).toBe('/parcel/me');
    expect(config?.params).toEqual({ status: 'ARRIVED' });
    expect(config?.headers.Authorization).toBe('Bearer token-1');
  });

  it('스펙이 다르면 ApiError 로 실패한다', async () => {
    respond(200, { parcels: [{ id: '1' }] });

    const error = await fetchMyParcels().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ message: '서버 응답 형식이 올바르지 않습니다.' });
  });

  it('서버 message 를 ApiError 로 정규화한다', async () => {
    respond(404, { message: '택배를 찾을 수 없습니다.' });

    const error = await fetchMyParcels().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ message: '택배를 찾을 수 없습니다.', status: 404 });
  });

  it('message 가 없는 에러 바디는 기본 문구를 쓴다', async () => {
    respond(403, { status: 403, error: 'Forbidden' });

    await expect(fetchMyParcels()).rejects.toMatchObject({
      message: '요청을 처리하지 못했습니다. (HTTP 403)',
      status: 403,
    });
  });

  it('401 이면 onUnauthorized 를 부른다', async () => {
    respond(401, {});

    await expect(fetchMyParcels()).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  function respondHtml(responseURL: string) {
    adapter.mockImplementationOnce(async (config: InternalAxiosRequestConfig) => ({
      data: '<!DOCTYPE html><html></html>',
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'text/html;charset=UTF-8' },
      config,
      request: { responseURL },
    }));
  }

  it('로그인 페이지로 리다이렉트된 HTML 응답은 인증 실패로 본다', async () => {
    respondHtml('https://api.example.test/login?redirect=1');

    await expect(fetchMyParcels()).rejects.toMatchObject({
      message: '로그인이 만료되었습니다. 다시 로그인해 주세요.',
      status: 401,
    });
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('로그인 페이지가 아닌 HTML(캡티브 포털 등)은 로그아웃시키지 않는다', async () => {
    respondHtml('http://captive.portal.test/welcome');

    await expect(fetchMyParcels()).rejects.toMatchObject({
      message: '서버 응답 형식이 올바르지 않습니다.',
    });
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('토큰이 만료됐으면 요청을 보내지 않고 onUnauthorized 를 부른다', async () => {
    configureApi({
      baseURL: 'https://api.example.test',
      getAccessToken: async () => {
        throw createSessionExpiredError();
      },
      onUnauthorized,
    });

    await expect(fetchMyParcels()).rejects.toMatchObject({
      message: '로그인이 만료되었습니다. 다시 로그인해 주세요.',
      status: 401,
    });
    expect(adapter).not.toHaveBeenCalled();
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });
});

describe('useCreateReportMutation', () => {
  it('POST /report 후 parcel 쿼리를 invalidate 한다', async () => {
    respond(201, report);
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { gcTime: Infinity },
        mutations: { retry: false, gcTime: Infinity },
      },
    });
    const invalidate = jest.spyOn(queryClient, 'invalidateQueries');
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = await renderHook(() => useCreateReportMutation(), { wrapper });
    const request = {
      invoiceNumber: '604122378890',
      lostEstimatedAt: '2026-07-06T15:30:00',
      content: '현관 앞에 없어요',
    };

    await act(async () => {
      await expect(result.current.mutateAsync(request)).resolves.toEqual(report);
    });

    const config = adapter.mock.calls[0]?.[0];
    expect(config?.method).toBe('post');
    expect(config?.url).toBe('/report');
    expect(JSON.parse(String(config?.data))).toEqual(request);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: parcelKeys.all });
  });
});
