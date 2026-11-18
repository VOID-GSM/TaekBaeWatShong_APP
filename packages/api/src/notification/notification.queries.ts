import type { NotificationListResponse, NotificationReadResponse } from '@taekbae/types';
import {
  type InfiniteData,
  infiniteQueryOptions,
  useMutation,
  type UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';

import type { ApiError } from '../client';
import { fetchNotifications, markNotificationRead } from './notification.api';
import { notificationKeys } from './notification.keys';

export const notificationQueries = {
  /**
   * 내 알림 무한 목록. 탭의 안 읽음 점과 알림 화면이 이 캐시 하나를 같이 쓴다 —
   * 안 읽은 개수는 별도 요청 없이 첫 페이지의 `unreadCount` 를 본다.
   */
  list: () =>
    infiniteQueryOptions({
      queryKey: notificationKeys.list(),
      queryFn: ({ pageParam }) => fetchNotifications({ cursor: pageParam }),
      initialPageParam: undefined as number | undefined,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    }),
};

export function useMarkNotificationReadMutation(): UseMutationResult<
  NotificationReadResponse,
  ApiError,
  number
> {
  const queryClient = useQueryClient();
  return useMutation<NotificationReadResponse, ApiError, number>({
    mutationFn: markNotificationRead,
    // 읽음 요청 전에 시작된 목록 재조회(탭 재진입·앱 복귀)가 늦게 끝나면 아래에서 고친 값을 덮어쓴다 — 먼저 취소한다.
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.list() });
    },
    // 무효화하지 않고 캐시를 직접 고친다 — 무한 목록을 무효화하면 받아 둔 페이지를 전부 다시 받고 스크롤 위치가 흔들린다.
    onSuccess: (res) => {
      queryClient.setQueryData<InfiniteData<NotificationListResponse, number | undefined>>(
        notificationKeys.list(),
        (data) =>
          data && {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              // 응답의 unreadCount 가 서버 기준 최신값이라 모든 페이지에 같이 넣는다(화면은 첫 페이지 값을 본다).
              unreadCount: res.unreadCount,
              notifications: page.notifications.map((notification) =>
                notification.id === res.id ? { ...notification, isRead: true } : notification,
              ),
            })),
          },
      );
    },
  });
}
