// packages/api 에는 테스트 러너가 없어, 알림 요청 함수와 읽음 mutation 을 이 앱에서 검증한다.
import {
  api,
  configureApi,
  fetchNotifications,
  markNotificationRead,
  notificationKeys,
  notificationQueries,
  useMarkNotificationReadMutation,
} from '@taekbae/api';
import type { NotificationListResponse, ParcelNotification } from '@taekbae/types';
import { type InfiniteData, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

function notification(overrides: Partial<ParcelNotification>): ParcelNotification {
  return {
    id: 1,
    type: 'ARRIVED',
    title: '택배가 도착했어요',
    message: '겨울 패딩이 도착했어요.',
    parcelId: 10,
    isRead: false,
    createdAt: '2026-07-06T15:00:00',
    ...overrides,
  };
}

type ListData = InfiniteData<NotificationListResponse, number | undefined>;

beforeAll(() => {
  configureApi({ baseURL: 'http://test', getAccessToken: async () => null });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('fetchNotifications', () => {
  const page = {
    unreadCount: 1,
    notifications: [
      notification({ id: 2, type: 'NEW_TYPE', createdAt: '2026-07-06T15:00:00.123' }),
      notification({ id: 1, type: 'UNCLAIMED_REMINDER', unclaimedDays: 3, isRead: true }),
    ],
    nextCursor: null,
  };

  it('cursor·size 는 값이 있을 때만 쿼리로 보낸다', async () => {
    const get = jest.spyOn(api(), 'get').mockResolvedValue({ data: page });

    await fetchNotifications();
    await fetchNotifications({ cursor: undefined });
    await fetchNotifications({ cursor: 0, size: 50 });

    expect(get).toHaveBeenNthCalledWith(1, '/notification', { params: {} });
    expect(get).toHaveBeenNthCalledWith(2, '/notification', { params: {} });
    expect(get).toHaveBeenNthCalledWith(3, '/notification', { params: { cursor: 0, size: 50 } });
  });

  it('모르는 종류, 밀리초 시각, null 커서도 통과시킨다', async () => {
    jest.spyOn(api(), 'get').mockResolvedValue({ data: page });

    const result = await fetchNotifications();

    expect(result.notifications.map((n) => n.type)).toEqual(['NEW_TYPE', 'UNCLAIMED_REMINDER']);
    expect(result.notifications[1]?.unclaimedDays).toBe(3);
    expect(result.nextCursor).toBeNull();
  });

  it('화면이 쓰는 필드가 어긋나면 ApiError', async () => {
    jest.spyOn(api(), 'get').mockResolvedValue({
      data: { ...page, notifications: [{ ...page.notifications[0], isRead: 'N' }] },
    });

    await expect(fetchNotifications()).rejects.toMatchObject({
      name: 'ApiError',
      message: '서버 응답 형식이 올바르지 않습니다.',
    });
  });
});

describe('markNotificationRead', () => {
  it('PATCH /notification/{id}/read 응답을 검증해 돌려준다', async () => {
    const patch = jest
      .spyOn(api(), 'patch')
      .mockResolvedValue({ data: { id: 7, isRead: true, unreadCount: 0 } });

    await expect(markNotificationRead(7)).resolves.toEqual({ id: 7, isRead: true, unreadCount: 0 });
    expect(patch).toHaveBeenCalledWith('/notification/7/read');
  });
});

describe('useMarkNotificationReadMutation', () => {
  function setup(data?: ListData) {
    // mutation 도 gcTime 을 Infinity 로 둔다 — 기본 5분 정리 타이머가 남아 Jest 가 종료되지 않는다.
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: Infinity, gcTime: Infinity },
        mutations: { gcTime: Infinity },
      },
    });
    if (data) queryClient.setQueryData(notificationKeys.list(), data);
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    return { queryClient, wrapper };
  }

  it('응답대로 해당 알림을 읽음으로, 모든 페이지의 unreadCount 를 바꾸고 재조회하지 않는다', async () => {
    const { queryClient, wrapper } = setup({
      pages: [
        { unreadCount: 2, notifications: [notification({ id: 3 })], nextCursor: 3 },
        { unreadCount: 2, notifications: [notification({ id: 2 })], nextCursor: null },
      ],
      pageParams: [undefined, 3],
    });
    jest.spyOn(api(), 'patch').mockResolvedValue({ data: { id: 2, isRead: true, unreadCount: 1 } });
    const get = jest.spyOn(api(), 'get');
    const invalidate = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = await renderHook(() => useMarkNotificationReadMutation(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync(2);
    });

    const data = queryClient.getQueryData<ListData>(notificationKeys.list());
    expect(data?.pages.map((p) => p.unreadCount)).toEqual([1, 1]);
    expect(data?.pages.flatMap((p) => p.notifications.map((n) => [n.id, n.isRead]))).toEqual([
      [3, false],
      [2, true],
    ]);
    expect(data?.pageParams).toEqual([undefined, 3]);
    expect(invalidate).not.toHaveBeenCalled();
    expect(get).not.toHaveBeenCalled();
  });

  it('읽음 요청 전에 시작된 목록 재조회는 취소해, 늦게 온 응답이 읽음 처리를 덮어쓰지 않는다', async () => {
    const before: NotificationListResponse = {
      unreadCount: 1,
      notifications: [notification({ id: 1 })],
      nextCursor: null,
    };
    const { queryClient, wrapper } = setup({ pages: [before], pageParams: [undefined] });
    let resolveStale: (value: { data: NotificationListResponse }) => void = () => {};
    jest
      .spyOn(api(), 'get')
      .mockReturnValue(new Promise((resolve) => (resolveStale = resolve)) as never);
    jest.spyOn(api(), 'patch').mockResolvedValue({ data: { id: 1, isRead: true, unreadCount: 0 } });

    // 탭 재진입 등으로 읽음 요청 전에 시작된 재조회
    const staleRefetch = queryClient
      .fetchInfiniteQuery({ ...notificationQueries.list(), staleTime: 0 })
      .catch(() => undefined);

    const { result } = await renderHook(() => useMarkNotificationReadMutation(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync(1);
      // 읽음 처리 전 상태의 응답이 뒤늦게 도착한다.
      resolveStale({ data: before });
      await staleRefetch;
    });

    const data = queryClient.getQueryData<ListData>(notificationKeys.list());
    expect(data?.pages[0]?.unreadCount).toBe(0);
    expect(data?.pages[0]?.notifications[0]?.isRead).toBe(true);
  });

  it('목록 캐시가 없어도 실패하지 않는다', async () => {
    const { queryClient, wrapper } = setup();
    jest.spyOn(api(), 'patch').mockResolvedValue({ data: { id: 1, isRead: true, unreadCount: 0 } });

    const { result } = await renderHook(() => useMarkNotificationReadMutation(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync(1);
    });

    expect(queryClient.getQueryData(notificationKeys.list())).toBeUndefined();
  });

  it('요청이 실패하면 캐시를 건드리지 않는다', async () => {
    const initial: ListData = {
      pages: [{ unreadCount: 1, notifications: [notification({ id: 1 })], nextCursor: null }],
      pageParams: [undefined],
    };
    const { queryClient, wrapper } = setup(initial);
    jest.spyOn(api(), 'patch').mockRejectedValue(new Error('403'));

    const { result } = await renderHook(() => useMarkNotificationReadMutation(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync(1).catch(() => undefined);
    });

    expect(queryClient.getQueryData(notificationKeys.list())).toEqual(initial);
  });
});
