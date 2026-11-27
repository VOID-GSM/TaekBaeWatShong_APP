import { configureApi } from '@taekbae/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import axios, { type AxiosAdapter, AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { PropsWithChildren } from 'react';

import { useChatRoom } from '../use-chat-room';

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

async function setup(roomId = 7) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(() => useChatRoom(roomId), { wrapper });
}

beforeEach(() => {
  adapter.mockReset();
  calls.length = 0;
  configureApi({ baseURL: 'https://api.test', getAccessToken: async () => 'token' });
});

describe('useChatRoom', () => {
  it('방 메시지를 날짜별로 묶고, 상대 메시지가 있으면 한 번만 읽음 처리한다', async () => {
    serve({
      'GET /chat/rooms/7': () => ({ data: room(1) }),
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
    expect(result.current.room?.partner.id).toBe(9);
    expect(
      result.current.sections.map(({ date, messages }) => [date, messages.map((m) => m.id)]),
    ).toEqual([
      ['2026년 7월 6일', [1, 2]],
      ['2026년 7월 7일', [3]],
    ]);
    await waitFor(() => expect(calls).toContain('PATCH /chat/rooms/7/read'));
    expect(calls.filter((call) => call === 'PATCH /chat/rooms/7/read')).toHaveLength(1);
    await unmount();
  });

  it('메시지를 보낸다', async () => {
    serve({
      'GET /chat/rooms/7': () => ({ data: room() }),
      'GET /chat/rooms/7/messages': () => ({ data: { messages: [], nextCursor: null } }),
      'POST /chat/rooms/7/messages': () => ({ data: message(1, true, '2026-07-06T15:30:00') }),
    });
    const { result, unmount } = await setup();

    await waitFor(() => expect(result.current.isPending).toBe(false));
    await act(async () => {
      await result.current.send('안녕하세요');
    });
    expect(calls).toContain('POST /chat/rooms/7/messages');
    await unmount();
  });

  it('잘못된 roomId 는 요청하지 않고 찾을 수 없다고 알린다', async () => {
    serve({});
    const { result, unmount } = await setup(0);

    expect(result.current.error?.message).toBe('채팅방을 찾을 수 없어요.');
    expect(result.current.isPending).toBe(false);
    expect(calls).toEqual([]);
    await unmount();
  });

  it('방을 불러오지 못하면 error 를 돌려준다', async () => {
    serve({ 'GET /chat/rooms/7': () => ({ status: 500, data: { message: '서버 오류' } }) });
    const { result, unmount } = await setup();

    await waitFor(() => expect(result.current.error?.message).toBe('서버 오류'));
    expect(result.current.isPending).toBe(false);
    await unmount();
  });
});
