import { api, configureApi, notificationKeys } from '@taekbae/api';
import type { NotificationListResponse, ParcelNotification } from '@taekbae/types';
import { type InfiniteData, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { useNotificationList, useUnreadNotificationCount } from '../use-notification-list';

function notification(overrides: Partial<ParcelNotification>): ParcelNotification {
  return {
    id: 1,
    type: 'ARRIVED',
    title: '택배가 도착했어요',
    message: '겨울 패딩이 도착했어요.',
    parcelId: 10,
    unclaimedDays: null,
    isRead: false,
    createdAt: '2026-07-06T15:00:00',
    ...overrides,
  };
}

type ListData = InfiniteData<NotificationListResponse, number | undefined>;

function createQueryClient(data?: ListData) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
  });
  // 캐시를 채워 첫 페이지 요청 없이 렌더한다. 키 팩토리 사용도 함께 검증된다.
  if (data) queryClient.setQueryData(notificationKeys.list(), data);
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

const firstPage: NotificationListResponse = {
  unreadCount: 3,
  notifications: [notification({ id: 5 }), notification({ id: 4, isRead: true })],
  nextCursor: 4,
};
const lastPage: NotificationListResponse = {
  unreadCount: 3,
  notifications: [notification({ id: 3 })],
  nextCursor: null,
};

beforeAll(() => {
  configureApi({ baseURL: 'http://test', getAccessToken: async () => null });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('useNotificationList', () => {
  it('받아 둔 페이지를 이어 붙이고, 안 읽은 개수는 첫 페이지 값을 쓴다', async () => {
    const { wrapper } = createQueryClient({
      pages: [firstPage, lastPage],
      pageParams: [undefined, 4],
    });
    const { result } = await renderHook(() => useNotificationList(), { wrapper });

    expect(result.current.notifications.map((n) => n.id)).toEqual([5, 4, 3]);
    expect(result.current.unreadCount).toBe(3);
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.hasNextPage).toBe(false);
  });

  it('다음 페이지는 마지막 페이지의 nextCursor 로 요청하고, 더 없으면 요청하지 않는다', async () => {
    const { wrapper } = createQueryClient({ pages: [firstPage], pageParams: [undefined] });
    const get = jest.spyOn(api(), 'get').mockResolvedValue({ data: lastPage });
    const { result } = await renderHook(() => useNotificationList(), { wrapper });
    expect(result.current.hasNextPage).toBe(true);

    await act(async () => {
      result.current.fetchNextPage();
    });

    await waitFor(() => expect(result.current.notifications.map((n) => n.id)).toEqual([5, 4, 3]));
    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith('/notification', { params: { cursor: 4 } });
    expect(result.current.hasNextPage).toBe(false);

    await act(async () => {
      result.current.fetchNextPage();
    });
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('다음 페이지를 받는 중에 다시 불러도 한 번만 요청한다', async () => {
    const { wrapper } = createQueryClient({ pages: [firstPage], pageParams: [undefined] });
    let resolve: (value: { data: NotificationListResponse }) => void = () => undefined;
    const get = jest.spyOn(api(), 'get').mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    const { result } = await renderHook(() => useNotificationList(), { wrapper });

    await act(async () => {
      result.current.fetchNextPage();
    });
    await waitFor(() => expect(result.current.isFetchingNextPage).toBe(true));
    await act(async () => {
      result.current.fetchNextPage();
    });
    expect(get).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolve({ data: lastPage });
    });
    await waitFor(() => expect(result.current.isFetchingNextPage).toBe(false));
  });

  it('첫 조회가 실패하면 빈 목록과 ApiError 를 준다', async () => {
    jest.spyOn(api(), 'get').mockResolvedValue({ data: { notifications: 'oops' } });
    const { wrapper } = createQueryClient();
    const { result } = await renderHook(() => useNotificationList(), { wrapper });

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error?.message).toBe('서버 응답 형식이 올바르지 않습니다.');
    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
  });
});

describe('useUnreadNotificationCount', () => {
  it('같은 캐시의 첫 페이지 unreadCount', async () => {
    const { wrapper } = createQueryClient({ pages: [firstPage], pageParams: [undefined] });
    const { result } = await renderHook(() => useUnreadNotificationCount(), { wrapper });

    expect(result.current).toBe(3);
  });

  it('첫 조회가 실패하면 0', async () => {
    jest.spyOn(api(), 'get').mockRejectedValue(new Error('network'));
    const { queryClient, wrapper } = createQueryClient();
    const { result } = await renderHook(() => useUnreadNotificationCount(), { wrapper });

    await waitFor(() =>
      expect(queryClient.getQueryState(notificationKeys.list())?.status).toBe('error'),
    );
    expect(result.current).toBe(0);
  });
});
