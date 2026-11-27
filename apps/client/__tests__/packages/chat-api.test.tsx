import {
  ApiError,
  chatKeys,
  configureApi,
  createChatRoom,
  fetchChatMessages,
  fetchChatPartners,
  fetchChatRooms,
  markChatRoomRead,
  reportKeys,
  sendChatMessage,
  useMarkChatRoomReadMutation,
  useSendChatMessageMutation,
} from '@taekbae/api';
import { adminReportSchema, chatRoomSchema } from '@taekbae/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import axios, { type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';
import type { PropsWithChildren } from 'react';

// packages/api 에 jest 가 아직 없어 앱에서 공개 API 로 검증한다.
// 네트워크 대신 axios adapter 를 바꿔 끼운다.
const adapter = jest.fn<ReturnType<AxiosAdapter>, Parameters<AxiosAdapter>>();
// packages/api 가 default export 의 create 를 쓰므로 같은 객체의 원본을 잡아 둔다.
// eslint-disable-next-line import/no-named-as-default-member
const realCreate = axios.create.bind(axios);
jest.spyOn(axios, 'create').mockImplementation((config) => realCreate({ ...config, adapter }));

function respond(data: unknown) {
  adapter.mockImplementationOnce(async (config: InternalAxiosRequestConfig) => ({
    data,
    status: 200,
    statusText: '',
    headers: {},
    config,
  }));
}

const lastConfig = () => adapter.mock.calls.at(-1)?.[0];

const room = {
  id: 7,
  type: 'DRIVER',
  partner: { id: 1, name: '김민준', role: 'STUDENT', studentNumber: '20614' },
  lastMessage: '안녕하세요',
  lastMessageAt: '2026-07-06T15:31:00.123456',
  unreadCount: 1,
  createdAt: '2026-07-06T15:00:00',
};

const message = {
  id: 1,
  roomId: 7,
  senderId: 1,
  senderName: '김민준',
  content: '안녕하세요',
  isMine: false,
  isRead: false,
  createdAt: '2026-07-06T15:31:00',
};

function wrapperWith(queryClient: QueryClient) {
  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

const newQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });

beforeEach(() => {
  adapter.mockReset();
  configureApi({ baseURL: 'https://api.example.test', getAccessToken: async () => 'token-1' });
});

describe('chat 스키마', () => {
  it('시간대 없는 서버 시각과 학번 없는 상대(nullish)를 받는다', () => {
    expect(
      chatRoomSchema.safeParse({
        ...room,
        partner: { id: 3, name: '이선생님', role: 'TEACHER', studentNumber: null },
        lastMessage: null,
        lastMessageAt: null,
      }).success,
    ).toBe(true);
  });

  it('adminReportSchema 는 reporterId 가 없어도, 있어도 받는다', () => {
    const report = {
      id: 3,
      reporterName: '김민준',
      alias: '겨울 패딩',
      invoiceNumber: '604122378890',
      lostEstimatedAt: '2026-07-06T15:30:00',
      progress: 'RECEIVED',
      createdAt: '2026-07-06T16:00:00',
    };
    expect(adminReportSchema.parse(report).reporterId).toBeUndefined();
    expect(adminReportSchema.parse({ ...report, reporterId: 1 }).reporterId).toBe(1);
  });
});

describe('chatKeys', () => {
  it('방·메시지 키는 rooms() 아래에 둔다', () => {
    expect(chatKeys.rooms()).toEqual(['chat', 'rooms']);
    expect(chatKeys.room(7)).toEqual(['chat', 'rooms', 7]);
    expect(chatKeys.messages(7)).toEqual(['chat', 'rooms', 7, 'messages']);
    expect(chatKeys.partners({ keyword: '김' })).toEqual(['chat', 'partners', { keyword: '김' }]);
  });
});

describe('chat 요청 함수', () => {
  it('GET /chat/rooms 응답을 파싱한다', async () => {
    respond({ totalUnreadCount: 1, rooms: [room] });
    await expect(fetchChatRooms()).resolves.toEqual({ totalUnreadCount: 1, rooms: [room] });
    expect(lastConfig()?.url).toBe('/chat/rooms');
  });

  it('스펙이 다르면 ApiError 로 실패한다', async () => {
    respond({ totalUnreadCount: 1, rooms: [{ ...room, id: '7' }] });
    await expect(fetchChatRooms()).rejects.toBeInstanceOf(ApiError);
  });

  it('POST /chat/rooms 에 partnerId 를 보낸다', async () => {
    respond(room);
    await expect(createChatRoom(1)).resolves.toEqual(room);
    expect(lastConfig()?.method).toBe('post');
    expect(JSON.parse(String(lastConfig()?.data))).toEqual({ partnerId: 1 });
  });

  it('메시지 목록·상대 검색은 query string 을 넘긴다', async () => {
    respond({ messages: [message], nextCursor: null });
    await fetchChatMessages(7, { size: 100 });
    expect(lastConfig()?.url).toBe('/chat/rooms/7/messages');
    expect(lastConfig()?.params).toEqual({ size: 100 });

    respond({ partners: [room.partner], hasNext: false });
    await fetchChatPartners({ keyword: '20614' });
    expect(lastConfig()?.url).toBe('/chat/partners');
    expect(lastConfig()?.params).toEqual({ keyword: '20614' });
  });

  it('메시지는 앞뒤 공백을 지워 보내고, 비었거나 1000자를 넘으면 요청하지 않는다', async () => {
    respond(message);
    await sendChatMessage(7, '  안녕하세요  ');
    expect(JSON.parse(String(lastConfig()?.data))).toEqual({ content: '안녕하세요' });

    adapter.mockClear();
    await expect(sendChatMessage(7, '   ')).rejects.toThrow('메시지 내용을 입력해주세요.');
    await expect(sendChatMessage(7, 'a'.repeat(1001))).rejects.toBeInstanceOf(ApiError);
    expect(adapter).not.toHaveBeenCalled();
  });

  it('PATCH /chat/rooms/{id}/read', async () => {
    respond({ roomId: 7, readCount: 1, unreadCount: 0 });
    await expect(markChatRoomRead(7)).resolves.toEqual({ roomId: 7, readCount: 1, unreadCount: 0 });
    expect(lastConfig()?.method).toBe('patch');
    expect(lastConfig()?.url).toBe('/chat/rooms/7/read');
  });
});

describe('chat mutation 훅', () => {
  it('메시지를 보내면 그 방 메시지와 방 목록을 무효화한다(신고 목록은 건드리지 않는다)', async () => {
    respond(message);
    const queryClient = newQueryClient();
    const invalidate = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = await renderHook(() => useSendChatMessageMutation(), {
      wrapper: wrapperWith(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ roomId: 7, content: '안녕하세요' });
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: chatKeys.messages(7) });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: chatKeys.rooms(), exact: true });
    expect(invalidate).not.toHaveBeenCalledWith({ queryKey: reportKeys.all });
  });

  it('읽음 처리하면 방 목록과 그 방을 무효화한다', async () => {
    respond({ roomId: 7, readCount: 1, unreadCount: 0 });
    const queryClient = newQueryClient();
    const invalidate = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = await renderHook(() => useMarkChatRoomReadMutation(), {
      wrapper: wrapperWith(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync(7);
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: chatKeys.rooms(), exact: true });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: chatKeys.room(7), exact: true });
  });
});
