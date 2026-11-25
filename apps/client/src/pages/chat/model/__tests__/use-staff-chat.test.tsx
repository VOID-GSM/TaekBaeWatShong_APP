import { configureApi } from '@taekbae/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import axios, { type AxiosAdapter, AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { PropsWithChildren } from 'react';

import { NO_STAFF_MESSAGE, useStaffChat } from '../use-staff-chat';

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
const message = (id: number, isMine: boolean, createdAt: string) => ({
  id,
  roomId: 7,
  senderId: isMine ? 1 : 9,
  senderName: isMine ? '김민준' : '관리자',
  content: `m${id}`,
  isMine,
  isRead: true,
  createdAt,
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
  return renderHook(() => useStaffChat(), { wrapper });
}

beforeEach(() => {
  adapter.mockReset();
  calls.length = 0;
  configureApi({ baseURL: 'https://api.test', getAccessToken: async () => 'token' });
});

describe('useStaffChat', () => {
  it('관리자와의 방 메시지를 날짜별로 묶고, 안 읽은 메시지가 있으면 읽음 처리한다', async () => {
    serve({
      'GET /chat/rooms': () => ({ data: { totalUnreadCount: 1, rooms: [room(1)] } }),
      'GET /chat/rooms/7/messages': () => ({
        data: {
          messages: [
            message(3, false, '2026-07-07T09:00:00'),
            message(2, true, '2026-07-06T15:31:00'),
            message(1, false, '2026-07-06T15:30:00'),
          ],
          nextCursor: null,
        },
      }),
      'PATCH /chat/rooms/7/read': () => ({ data: { roomId: 7, readCount: 1, unreadCount: 0 } }),
    });
    const { result, unmount } = await setup();

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.partner?.id).toBe(9);
    expect(
      result.current.sections.map(({ date, messages }) => [date, messages.map((m) => m.id)]),
    ).toEqual([
      ['2026년 7월 6일', [1, 2]],
      ['2026년 7월 7일', [3]],
    ]);
    await waitFor(() => expect(calls).toContain('PATCH /chat/rooms/7/read'));
    expect(calls).not.toContain('GET /chat/partners');
    await unmount();
  });

  it('방이 없으면 관리자를 찾아 두고, 첫 메시지를 보낼 때 방을 만든다', async () => {
    let created = false;
    serve({
      'GET /chat/rooms': () => ({
        data: { totalUnreadCount: 0, rooms: created ? [room()] : [] },
      }),
      'GET /chat/partners': () => ({ data: { partners: [admin], hasNext: false } }),
      'POST /chat/rooms': () => {
        created = true;
        return { data: room() };
      },
      'POST /chat/rooms/7/messages': () => ({ data: message(1, true, '2026-07-06T15:30:00') }),
      'GET /chat/rooms/7/messages': () => ({
        data: { messages: [message(1, true, '2026-07-06T15:30:00')], nextCursor: null },
      }),
    });
    const { result, unmount } = await setup();

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.partner?.id).toBe(9);
    expect(result.current.sections).toEqual([]);

    await act(async () => {
      await result.current.send('안녕하세요');
    });
    expect(calls).toEqual(
      expect.arrayContaining(['POST /chat/rooms', 'POST /chat/rooms/7/messages']),
    );
    await unmount();
  });

  it('방도 관리자도 없으면 보내기가 안내 문구로 실패한다', async () => {
    serve({
      'GET /chat/rooms': () => ({ data: { totalUnreadCount: 0, rooms: [] } }),
      'GET /chat/partners': () => ({ data: { partners: [], hasNext: false } }),
    });
    const { result, unmount } = await setup();

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.partner).toBeNull();
    await act(async () => {
      await expect(result.current.send('안녕하세요')).rejects.toThrow(NO_STAFF_MESSAGE);
    });
    await unmount();
  });

  it('방 목록을 불러오지 못하면 error 를 돌려준다', async () => {
    serve({ 'GET /chat/rooms': () => ({ status: 500, data: { message: '서버 오류' } }) });
    const { result, unmount } = await setup();

    await waitFor(() => expect(result.current.error?.message).toBe('서버 오류'));
    expect(result.current.isPending).toBe(false);
    await unmount();
  });
});
