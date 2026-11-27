import { configureApi } from '@taekbae/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import axios, { type AxiosAdapter, AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { PropsWithChildren } from 'react';

import { NO_STAFF_MESSAGE, useChatList } from '../use-chat-list';

type Route = (config: InternalAxiosRequestConfig) => { status?: number; data: unknown };

// 네트워크 대신 axios adapter 를 바꿔 끼운다.
const adapter = jest.fn<ReturnType<AxiosAdapter>, Parameters<AxiosAdapter>>();
// packages/api 가 default export 의 create 를 쓰므로 같은 객체의 원본을 잡아 둔다.
// eslint-disable-next-line import/no-named-as-default-member
const realCreate = axios.create.bind(axios);
jest.spyOn(axios, 'create').mockImplementation((config) => realCreate({ ...config, adapter }));

const calls: string[] = [];
/** `METHOD /path` 별 응답. 등록하지 않은 요청은 404. 보낸 요청은 `calls` 에 쌓인다. */
function serve(routes: Record<string, Route>) {
  adapter.mockImplementation(async (config) => {
    const key = `${config.method?.toUpperCase()} ${config.url}`;
    calls.push(key);
    const route = routes[key];
    const { status = 200, data } = route ? route(config) : { status: 404, data: {} };
    const response = { data, status, statusText: '', headers: {}, config };
    if (status >= 400) throw new AxiosError('error', undefined, config, undefined, response);
    return response;
  });
}

const admin = { id: 9, name: '학생생활안전부', role: 'ADMIN', studentNumber: null };
const room = (unreadCount = 0) => ({
  id: 7,
  type: 'DRIVER',
  partner: admin,
  lastMessage: '확인해 볼게요',
  lastMessageAt: '2026-07-06T15:31:00',
  unreadCount,
  createdAt: '2026-07-06T15:00:00',
});

async function setup() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(() => useChatList(), { wrapper });
}

beforeEach(() => {
  adapter.mockReset();
  calls.length = 0;
  configureApi({ baseURL: 'https://api.test', getAccessToken: async () => 'token' });
});

const teacher = { id: 5, name: '이선생', role: 'TEACHER', studentNumber: null };

describe('useChatList', () => {
  it('방을 카드로 바꾸고 학생생활안전부와의 방이 있는지 알려 준다', async () => {
    serve({
      'GET /chat/rooms': () => ({
        data: {
          totalUnreadCount: 1,
          rooms: [room(1), { ...room(), id: 8, type: 'CLIENT', partner: teacher }],
        },
      }),
    });
    const { result, unmount } = await setup();

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.hasStaffRoom).toBe(true);
    expect(
      result.current.rooms.map(({ id, partnerName, partnerLabel }) => [
        id,
        partnerName,
        partnerLabel,
      ]),
    ).toEqual([
      [7, '학생생활안전부', ''],
      [8, '이선생', '선생님'],
    ]);
    await act(async () => {
      await expect(result.current.startStaffChat()).resolves.toBe(7);
    });
    expect(calls).not.toContain('POST /chat/rooms');
    await unmount();
  });

  it('학생생활안전부와의 방이 없으면 관리자를 찾아 방을 만든다', async () => {
    serve({
      'GET /chat/rooms': () => ({ data: { totalUnreadCount: 0, rooms: [] } }),
      'GET /chat/partners': () => ({ data: { partners: [teacher, admin], hasNext: false } }),
      'POST /chat/rooms': (config) => {
        expect(JSON.parse(String(config.data))).toEqual({ partnerId: 9 });
        return { data: room() };
      },
    });
    const { result, unmount } = await setup();

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.hasStaffRoom).toBe(false);
    await act(async () => {
      await expect(result.current.startStaffChat()).resolves.toBe(7);
    });
    await unmount();
  });

  it('채팅할 관리자가 없으면 안내 문구로 실패한다', async () => {
    serve({
      'GET /chat/rooms': () => ({ data: { totalUnreadCount: 0, rooms: [] } }),
      'GET /chat/partners': () => ({ data: { partners: [teacher], hasNext: false } }),
    });
    const { result, unmount } = await setup();

    await waitFor(() => expect(result.current.isPending).toBe(false));
    await act(async () => {
      await expect(result.current.startStaffChat()).rejects.toThrow(NO_STAFF_MESSAGE);
    });
    await waitFor(() => expect(result.current.startError?.message).toBe(NO_STAFF_MESSAGE));
    await unmount();
  });
});
