import { reportQueries } from '@taekbae/api';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getLostReportState,
  type LostReport,
  LostReportCard,
  type LostReportState,
} from '@/entities/lost-report';
import { Badge, Button, makeStyles, TopBar, Typography, useTheme } from '@/shared/ui';

export interface LostReportsPageProps {
  /** 채팅 화면이 생기면 연결한다. 없으면 버튼을 눌러도 아무 일도 하지 않는다. */
  onOpenChat?: (report: LostReport) => void;
}

/** 상태별 채팅 버튼. 처리 완료된 신고는 채팅방이 있을 때만 다시 열 수 있다. */
function getChatAction(report: LostReport, state: LostReportState) {
  if (state === 'new') return { label: '1:1 채팅 시작', variant: 'brand' } as const;
  if (report.chatRoomId != null) return { label: '채팅방 열기', variant: 'soft' } as const;
  return null;
}

/** 관리자 분실 신고 목록 (시안 A7). */
export function LostReportsPage({ onOpenChat }: LostReportsPageProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const {
    data: reports,
    error,
    isPending,
    isRefetching,
    refetch,
  } = useQuery(reportQueries.adminList());

  const renderBody = () => {
    // 백그라운드 재조회가 실패해도 react-query 는 기존 데이터를 유지한다 — 목록이 있으면 목록을 우선 보여준다.
    if (reports === undefined && isPending) {
      return (
        <View style={styles.center}>
          <ActivityIndicator
            color={colors.textBrand}
            accessibilityLabel="분실 신고를 불러오는 중"
          />
        </View>
      );
    }

    if (reports === undefined) {
      return (
        <View style={[styles.center, styles.message]}>
          <Typography variant="bodyMStrong" align="center" accessibilityRole="alert">
            분실 신고를 불러오지 못했어요.
          </Typography>
          {error !== null && (
            <Typography color="textSecondary" align="center">
              {error.message}
            </Typography>
          )}
          <Button
            variant="brand"
            label="다시 시도"
            onPress={() => void refetch()}
            style={styles.retry}
          />
        </View>
      );
    }

    const states = reports.map(getLostReportState);
    const newCount = states.filter((state) => state === 'new').length;
    const chatRequestedCount = states.filter((state) => state === 'chatRequested').length;

    return (
      <FlatList
        data={reports}
        keyExtractor={(report) => String(report.id)}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor={colors.textBrand}
            colors={[colors.textBrand]}
          />
        }
        ListHeaderComponent={
          <View style={styles.summary}>
            <Typography style={styles.flex}>접수된 신고 {reports.length}건</Typography>
            <Badge label={`신규 ${newCount}`} tone="danger" />
            <Badge label={`채팅 요청 ${chatRequestedCount}`} />
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Typography color="textSecondary" align="center">
              접수된 분실 신고가 없어요.
            </Typography>
          </View>
        }
        renderItem={({ item, index }) => {
          const action = getChatAction(item, states[index] ?? getLostReportState(item));

          return (
            <LostReportCard
              report={item}
              action={
                action && (
                  <Button
                    size="small"
                    variant={action.variant}
                    label={action.label}
                    // 카드마다 라벨이 같아서, 버튼만 골라 탐색해도 어느 신고인지 알 수 있게 한다.
                    accessibilityLabel={`${item.reporterName} ${item.alias} 신고, ${action.label}`}
                    onPress={() => onOpenChat?.(item)}
                  />
                )
              }
            />
          );
        }}
      />
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <TopBar variant="title" title="분실 신고" />
      {renderBody()}
    </SafeAreaView>
  );
}

const useStyles = makeStyles(({ colors, spacing }) => ({
  screen: { flex: 1, backgroundColor: colors.bgApp },
  content: {
    flexGrow: 1,
    gap: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  summary: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  message: { gap: spacing.sm, paddingHorizontal: spacing['2xl'] },
  retry: { marginTop: spacing.lg },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
}));
