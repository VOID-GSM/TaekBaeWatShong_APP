import { type ApiError, notificationKeys, notificationQueries } from '@taekbae/api';
import type { ParcelNotification } from '@taekbae/types';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useRef, useState } from 'react';

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
  /**
   * 화면이 포커스될 때 부른다 (`useFocusEffect` 에 그대로 넘기면 된다). 참조가 바뀌지 않는다.
   * TabSlot 은 한 번 연 탭을 언마운트하지 않아, 탭을 다시 열어도 refetchOnMount 가 일어나지 않는다.
   * 그래서 포커스될 때 stale 인 경우만 다시 받는다 — 무한 목록 refetch 는 받아 둔 페이지를 전부 다시 받으므로
   * 매번 받지 않고 refetchOnWindowFocus 처럼 staleTime 판단에 맡긴다. 첫 포커스는 마운트 조회와 겹쳐 건너뛴다.
   */
  refetchOnFocus: () => void;
  /** 당겨서 새로고침 중. `isRefetching` 은 백그라운드 재조회(탭 진입, 탭 빨간 점 쿼리)에도 true 라 따로 둔다. */
  isPullRefreshing: boolean;
  /** 마지막 당겨서 새로고침의 실패. 그 뒤 다른 재조회(포커스·앱 복귀)가 성공하면 null 로 돌아간다. */
  pullRefreshError: ApiError | null;
  pullRefresh: () => Promise<void>;
}

export function useNotificationList(): UseNotificationListResult {
  const queryClient = useQueryClient();
  const query = useInfiniteQuery(notificationQueries.list());
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage, refetch } = query;
  // @taekbae/api 의 요청 함수는 실패를 모두 ApiError 로 정규화한다.
  const error = query.error as ApiError | null;

  const notifications = useMemo(
    () => data?.pages.flatMap((page) => page.notifications) ?? [],
    [data],
  );

  const isFirstFocus = useRef(true);
  const refetchOnFocus = useCallback(() => {
    if (isFirstFocus.current) {
      isFirstFocus.current = false;
      return;
    }
    void queryClient.refetchQueries({ queryKey: notificationKeys.list(), stale: true });
  }, [queryClient]);

  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  // 목록이 있으면 재조회 실패에도 목록을 그대로 두므로, 당겨서 새로고침이 실패했는지는 따로 기억해 알린다.
  const [lastPullError, setLastPullError] = useState<ApiError | null>(null);
  const pullRefresh = useCallback(async () => {
    setIsPullRefreshing(true);
    try {
      await refetch();
      const state = queryClient.getQueryState<unknown, ApiError>(notificationKeys.list());
      setLastPullError(state?.status === 'error' ? state.error : null);
    } finally {
      setIsPullRefreshing(false);
    }
  }, [queryClient, refetch]);

  return {
    notifications,
    unreadCount: data?.pages[0]?.unreadCount ?? 0,
    // isLoading(isPending && isFetching) 은 오프라인으로 멈춘 쿼리에서 false 라 '알림 없음'으로 오인된다.
    isPending: query.isPending,
    error,
    refetch: () => refetch(),
    fetchNextPage: () => {
      if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
    },
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError: query.isFetchNextPageError,
    refetchOnFocus,
    isPullRefreshing,
    pullRefreshError: error !== null ? lastPullError : null,
    pullRefresh,
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
