import { type ApiError, notificationKeys, useMarkNotificationReadMutation } from '@taekbae/api';
import { useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  type ListRenderItem,
  RefreshControl,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  NotificationItem,
  type ParcelNotification,
  useNotificationList,
} from '@/entities/notification';
import { Badge, Button, makeStyles, TopBar, Typography, useTheme } from '@/shared/ui';

export interface NotificationsPageProps {
  /** 사용자용 택배 화면이 생기면 연결한다. 없으면 누른 알림을 읽음 처리만 한다. */
  onOpenParcel?: (parcelId: number) => void;
}

/** 택배 상태 알림 목록. 시안이 없어 기존 토큰·컴포넌트로 구성했다 — 디자인 미대조. */
export function NotificationsPage({ onOpenParcel }: NotificationsPageProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const {
    notifications,
    unreadCount,
    isPending,
    error,
    refetch,
    fetchNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = useNotificationList();
  const { mutate: markRead } = useMarkNotificationReadMutation();
  const queryClient = useQueryClient();

  // TabSlot 은 한 번 연 탭을 언마운트하지 않아, 탭을 다시 열어도 refetchOnMount 가 일어나지 않는다.
  // 포커스될 때 stale 인 경우만 다시 받는다 — 무한 목록 refetch 는 받아 둔 페이지를 전부 다시 받으므로
  // 매번 받지 않고 refetchOnWindowFocus 처럼 staleTime 판단에 맡긴다. 첫 포커스는 마운트 조회와 겹쳐 건너뛴다.
  const isFirstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      void queryClient.refetchQueries({ queryKey: notificationKeys.list(), stale: true });
    }, [queryClient]),
  );

  // isRefetching 은 백그라운드 재조회(탭 진입, 탭 빨간 점 쿼리)에도 true 가 된다.
  // 사용자가 당겼을 때만 스피너를 보여 주려고 따로 둔다.
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  // 목록이 있으면 재조회 실패에도 목록을 그대로 두므로, 당겨서 새로고침이 실패했는지는 따로 기억해 알린다.
  const [pullRefreshError, setPullRefreshError] = useState<ApiError | null>(null);
  const onPullRefresh = async () => {
    setIsPullRefreshing(true);
    try {
      await refetch();
      const state = queryClient.getQueryState<unknown, ApiError>(notificationKeys.list());
      setPullRefreshError(state?.status === 'error' ? state.error : null);
    } finally {
      setIsPullRefreshing(false);
    }
  };
  // 그 뒤 다른 재조회(포커스·앱 복귀)가 성공하면 error 가 비워지므로 안내도 함께 숨긴다.
  const refreshError = error !== null ? pullRefreshError : null;

  const onPressItem = useCallback(
    (notification: ParcelNotification) => {
      // 읽음 처리 실패는 알리지 않는다 — 다음 조회 때 다시 안 읽음으로 보인다.
      if (!notification.isRead) markRead(notification.id);
      onOpenParcel?.(notification.parcelId);
    },
    [markRead, onOpenParcel],
  );

  const renderItem = useCallback<ListRenderItem<ParcelNotification>>(
    ({ item }) => <NotificationItem notification={item} onPress={onPressItem} />,
    [onPressItem],
  );

  const renderBody = () => {
    if (isPending) {
      return (
        <View style={styles.center}>
          <ActivityIndicator color={colors.textBrand} accessibilityLabel="알림을 불러오는 중" />
        </View>
      );
    }

    // 재조회가 실패해도 react-query 는 받아 둔 페이지를 유지한다 — 목록이 있으면 목록을 우선 보여준다.
    if (notifications.length === 0 && error !== null) {
      return (
        <View style={[styles.center, styles.message]}>
          <Typography variant="bodyMStrong" align="center" accessibilityRole="alert">
            알림을 불러오지 못했어요.
          </Typography>
          <Typography color="textSecondary" align="center">
            {error.message}
          </Typography>
          <Button
            variant="brand"
            label="다시 시도"
            onPress={() => void refetch()}
            style={styles.retry}
          />
        </View>
      );
    }

    return (
      <FlatList
        testID="notifications-list"
        data={notifications}
        keyExtractor={(notification) => String(notification.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.content}
        onEndReached={() => {
          // 다음 페이지가 실패했으면 자동으로 다시 부르지 않는다 — footer 의 다시 시도로만 재요청한다.
          if (!isFetchNextPageError) fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isPullRefreshing}
            onRefresh={() => void onPullRefresh()}
            tintColor={colors.textBrand}
            colors={[colors.textBrand]}
          />
        }
        ListHeaderComponent={
          refreshError !== null || unreadCount > 0 ? (
            <View style={styles.header}>
              {refreshError !== null && (
                <View style={styles.refreshError} accessibilityRole="alert">
                  <Typography variant="caption" color="textDanger">
                    새로고침하지 못했어요.
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {refreshError.message}
                  </Typography>
                </View>
              )}
              {unreadCount > 0 && (
                <View style={styles.summary}>
                  <Badge label={`안 읽은 알림 ${unreadCount}개`} />
                </View>
              )}
            </View>
          ) : undefined
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Typography color="textSecondary" align="center">
              아직 받은 알림이 없어요.
            </Typography>
          </View>
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.footer}>
              <ActivityIndicator
                size="small"
                color={colors.textBrand}
                accessibilityLabel="알림을 더 불러오는 중"
              />
            </View>
          ) : isFetchNextPageError ? (
            <View style={styles.footer}>
              <Typography color="textSecondary" align="center">
                더 불러오지 못했어요
              </Typography>
              <Button
                variant="outline"
                size="m"
                label="다시 시도"
                accessibilityLabel="알림 더 불러오기 다시 시도"
                onPress={fetchNextPage}
                style={styles.footerRetry}
              />
            </View>
          ) : undefined
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <TopBar title="알림" />
      {renderBody()}
    </SafeAreaView>
  );
}

const useStyles = makeStyles(({ colors, radius, spacing }) => ({
  screen: { flex: 1, backgroundColor: colors.bgApp },
  content: {
    flexGrow: 1,
    gap: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  header: { gap: spacing.md },
  refreshError: {
    gap: spacing['2xs'],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.bgDangerSoft,
  },
  summary: { flexDirection: 'row' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  message: { gap: spacing.sm, paddingHorizontal: spacing['2xl'] },
  retry: { marginTop: spacing.lg },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  footer: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  footerRetry: { alignSelf: 'center' },
}));
