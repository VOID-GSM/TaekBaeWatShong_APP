import { FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { type LostReport, LostReportCard, sampleLostReports } from '@/entities/lost-report';
import { Badge, Button, makeStyles, TopBar, Typography } from '@/shared/ui';

export interface LostReportsPageProps {
  /** 채팅 화면이 생기면 연결한다. 없으면 버튼을 눌러도 아무 일도 하지 않는다. */
  onOpenChat?: (report: LostReport) => void;
}

export function LostReportsPage({ onOpenChat }: LostReportsPageProps) {
  const styles = useStyles();
  // TODO: 분실 신고 API 가 생기면 쿼리 결과로 바꾼다.
  const reports = sampleLostReports;
  const newCount = reports.filter((report) => report.status === 'NEW').length;
  const chatRequestedCount = reports.filter((report) => report.status === 'CHAT_REQUESTED').length;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <TopBar variant="title" title="분실 신고" />
      <FlatList
        data={reports}
        keyExtractor={(report) => String(report.id)}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.summary}>
            <Typography style={styles.flex}>접수된 신고 {reports.length}건</Typography>
            <Badge label={`신규 ${newCount}`} tone="danger" />
            <Badge label={`채팅 요청 ${chatRequestedCount}`} />
          </View>
        }
        renderItem={({ item }) => {
          const isChatRequested = item.status === 'CHAT_REQUESTED';
          const actionLabel = isChatRequested ? '채팅방 열기' : '1:1 채팅 시작';

          return (
            <LostReportCard
              report={item}
              action={
                <Button
                  size="small"
                  variant={isChatRequested ? 'soft' : 'brand'}
                  label={actionLabel}
                  // 카드마다 라벨이 같아서, 버튼만 골라 탐색해도 어느 신고인지 알 수 있게 한다.
                  accessibilityLabel={`${item.reporter.name} ${item.productName} 신고, ${actionLabel}`}
                  onPress={() => onOpenChat?.(item)}
                />
              }
            />
          );
        }}
      />
    </SafeAreaView>
  );
}

const useStyles = makeStyles(({ colors, spacing }) => ({
  screen: { flex: 1, backgroundColor: colors.bgApp },
  content: {
    gap: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  summary: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
}));
