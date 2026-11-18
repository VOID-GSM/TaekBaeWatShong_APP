import { type ApiError, notificationQueries } from '@taekbae/api';
import type { ParcelNotification } from '@taekbae/types';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

export interface UseNotificationListResult {
  /** 받아 둔 모든 페이지를 이어 붙인 목록(최신순). */
  notifications: ParcelNotification[];
  /** 안 읽은 알림 전체 개수 — 첫 페이지 값. 아직 없으면 0. */
  unreadCount: number;
  /** 아직 데이터가 없다 (요청 중이거나, 오프라인이라 요청이 멈춘 상태 포함). */
  isPending: boolean;
  error: ApiError | null;
  refetch: () => Promise<unknown>;
  /** 다음 페이지가 있고 이미 받는 중이 아닐 때만 요청한다 — `onEndReached` 가 여러 번 불려도 중복 요청하지 않게. */
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isFetchNextPageError: boolean;
}

export function useNotificationList(): UseNotificationListResult {
  const query = useInfiniteQuery(notificationQueries.list());
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } = query;

  const notifications = useMemo(
    () => data?.pages.flatMap((page) => page.notifications) ?? [],
    [data],
  );

  return {
    notifications,
    unreadCount: data?.pages[0]?.unreadCount ?? 0,
    // isLoading(isPending && isFetching) 은 오프라인으로 멈춘 쿼리에서 false 라 '알림 없음'으로 오인된다.
    isPending: query.isPending,
    // @taekbae/api 의 요청 함수는 실패를 모두 ApiError 로 정규화한다.
    error: query.error as ApiError | null,
    refetch: () => query.refetch(),
    fetchNextPage: () => {
      if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
    },
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError: query.isFetchNextPageError,
  };
}

/**
 * 탭의 안 읽음 점에 쓰는 안 읽은 알림 개수. 알림 화면과 같은 무한 쿼리 캐시의 첫 페이지 값을 본다.
 * 아직 받지 못했거나 첫 조회가 실패했으면 0. 다시 조회하다 실패하면 마지막으로 받은 값을 유지한다.
 */
export function useUnreadNotificationCount(): number {
  const { data } = useInfiniteQuery({
    ...notificationQueries.list(),
    select: (result) => result.pages[0]?.unreadCount ?? 0,
  });
  return data ?? 0;
}
