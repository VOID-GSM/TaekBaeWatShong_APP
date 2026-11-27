import { chatKeys, configureApi, reportKeys } from '@taekbae/api';
import type { AdminReport } from '@taekbae/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import axios, { type AxiosAdapter, AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { PropsWithChildren } from 'react';

import {
  findReporterPartner,
  REPORTER_NOT_FOUND_MESSAGE,
  useStartReportChat,
} from '../use-start-report-chat';

type Route = (config: InternalAxiosRequestConfig) => { status?: number; data: unknown };

// 네트워크 대신 axios adapter 를 바꿔 끼운다.
const adapter = jest.fn<ReturnType<AxiosAdapter>, Parameters<AxiosAdapter>>();
// packages/api 가 default export 의 create 를 쓰므로 같은 객체의 원본을 잡아 둔다.
// eslint-disable-next-line import/no-named-as-default-member
const realCreate = axios.create.bind(axios);
jest.spyOn(axios, 'create').mockImplementation((config) => realCreate({ ...config, adapter }));

/** `METHOD /path` 별 응답. 등록하지 않은 요청은 404. */
function serve(routes: Record<string, Route>) {
  adapter.mockImplementation(async (config) => {
    const route = routes[`${config.method?.toUpperCase()} ${config.url}`];
    const { status = 200, data } = route ? route(config) : { status: 404, data: {} };
    const response = { data, status, statusText: '', headers: {}, config };
    if (status >= 400) throw new AxiosError('error', undefined, config, undefined, response);
    return response;
  });
}

const student = { id: 1, name: '김민준', role: 'STUDENT' as const, studentNumber: '20614' };
const room = (partner: unknown) => ({
  id: 7,
  type: 'DRIVER',
  partner,
  lastMessage: null,
  lastMessageAt: null,
  unreadCount: 0,
  createdAt: '2026-07-06T15:00:00',
});

const report: AdminReport = {
  id: 3,
  reporterName: '김민준',
  studentNumber: '20614',
  alias: '겨울 패딩',
  invoiceNumber: '604122378890',
  lostEstimatedAt: '2026-07-06T15:30:00',
  progress: 'RECEIVED',
  chatRoomId: null,
  createdAt: '2026-07-06T16:00:00',
};

async function setup() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  const invalidate = jest.spyOn(queryClient, 'invalidateQueries');
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = await renderHook(() => useStartReportChat(), { wrapper });
  return { result, invalidate };
}

beforeEach(() => {
  adapter.mockReset();
  configureApi({ baseURL: 'https://api.test', getAccessToken: async () => 'token' });
});

describe('findReporterPartner', () => {
  const teacher = { id: 3, name: '김민준', role: 'TEACHER' as const, studentNumber: null };
  const admin = { id: 9, name: '김민준', role: 'ADMIN' as const, studentNumber: null };
  const sameName = { id: 4, name: '김민준', role: 'STUDENT' as const, studentNumber: '10101' };

  it('학번이 같은 상대를 우선한다', () => {
    expect(findReporterPartner([sameName, student], report)?.id).toBe(1);
  });

  it('학번으로 못 찾으면 이름이 같은 상대가 한 명일 때만 고른다(관리자 제외)', () => {
    const noNumber = { ...report, studentNumber: null };
    expect(findReporterPartner([teacher, admin], noNumber)?.id).toBe(3);
    expect(findReporterPartner([teacher, sameName], noNumber)).toBeNull();
    expect(findReporterPartner([], noNumber)).toBeNull();
  });

  it('신고에 학번이 있으면 학번이 다른 동명이인은 고르지 않는다', () => {
    expect(findReporterPartner([sameName], report)).toBeNull();
    expect(findReporterPartner([teacher], report)?.id).toBe(3);
  });

  it('검색 결과가 더 있으면 이름만으로 고르지 않는다', () => {
    const noNumber = { ...report, studentNumber: null };
    expect(findReporterPartner([teacher], noNumber, true)).toBeNull();
    expect(findReporterPartner([student], report, true)?.id).toBe(1);
  });
});

describe('useStartReportChat', () => {
  it('chatRoomId 가 있으면 요청 없이 그 방을 돌려준다', async () => {
    const { result } = await setup();
    await act(async () => {
      await expect(result.current.start({ ...report, chatRoomId: 9 })).resolves.toBe(9);
    });
    expect(adapter).not.toHaveBeenCalled();
  });

  it('reporterId 가 있으면 검색 없이 그 사용자와 방을 만든다', async () => {
    serve({ 'POST /chat/rooms': () => ({ data: room(student) }) });
    const { result } = await setup();
    await act(async () => {
      await expect(result.current.start({ ...report, reporterId: 1 })).resolves.toBe(7);
    });
    expect(adapter).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(adapter.mock.calls[0]?.[0].data))).toEqual({ partnerId: 1 });
  });

  it('없으면 학번으로 신고자를 찾아 방을 만들고 채팅·신고 목록을 무효화한다', async () => {
    const searched: unknown[] = [];
    serve({
      'GET /chat/partners': (config) => {
        searched.push(config.params);
        return { data: { partners: [student], hasNext: false } };
      },
      'POST /chat/rooms': () => ({ data: room(student) }),
    });
    const { result, invalidate } = await setup();
    await act(async () => {
      await expect(result.current.start(report)).resolves.toBe(7);
    });
    expect(searched).toEqual([{ keyword: '20614', size: 20 }]);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: chatKeys.rooms(), exact: true });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: reportKeys.all });
  });

  it('학번으로 못 찾으면 이름으로 다시 찾는다', async () => {
    const searched: string[] = [];
    const found = { ...student, studentNumber: null };
    serve({
      'GET /chat/partners': (config) => {
        searched.push((config.params as { keyword: string }).keyword);
        return { data: { partners: searched.length === 1 ? [] : [found], hasNext: false } };
      },
      'POST /chat/rooms': () => ({ data: room(found) }),
    });
    const { result } = await setup();
    await act(async () => {
      await expect(result.current.start(report)).resolves.toBe(7);
    });
    expect(searched).toEqual(['20614', '김민준']);
  });

  it('찾지 못하면 안내 문구로 실패하고 error 에 남긴다', async () => {
    serve({ 'GET /chat/partners': () => ({ data: { partners: [], hasNext: false } }) });
    const { result } = await setup();
    await act(async () => {
      await expect(result.current.start(report)).rejects.toThrow(REPORTER_NOT_FOUND_MESSAGE);
    });
    expect(result.current.error?.message).toBe(REPORTER_NOT_FOUND_MESSAGE);
    expect(result.current.isPending).toBe(false);
  });
});
