import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Badge, makeStyles, Typography } from '@/shared/ui';

import { formatLostAt, formatReporter, formatWaybill } from '../lib/format';
import type { LostReport } from '../model/lost-report';

export interface LostReportCardProps {
  report: LostReport;
  /** 카드 맨 아래 버튼 자리. 채팅 시작·열기처럼 사용자 행동은 바깥 계층이 넣는다. */
  action?: ReactNode;
}

/** 분실 신고 한 건 (Figma `ReportCard`). */
export function LostReportCard({ report, action }: LostReportCardProps) {
  const styles = useStyles();
  const isChatRequested = report.status === 'CHAT_REQUESTED';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        {/* 이름 첫 글자는 옆의 신고자 이름과 겹치므로 스크린리더에서 숨긴다. */}
        <View
          style={styles.avatar}
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Typography color="textBrand">{report.reporter.name.slice(0, 1)}</Typography>
        </View>
        <Typography style={styles.flex}>{formatReporter(report.reporter)}</Typography>
        <Badge
          label={isChatRequested ? '채팅 요청' : '분실 신고'}
          tone={isChatRequested ? 'brand' : 'danger'}
        />
      </View>

      <View style={styles.product}>
        <Typography variant="headingH2">{report.productName}</Typography>
        <Typography variant="caption" color="textSecondary">
          {formatWaybill(report)}
        </Typography>
      </View>

      <View style={styles.box}>
        <Typography variant="micro" color="textTertiary">
          분실 예상 시각
        </Typography>
        <Typography>{formatLostAt(report.lostAt)}</Typography>
      </View>

      <Typography color="textSecondary">{report.content}</Typography>

      {action}
    </View>
  );
}

const useStyles = makeStyles(({ colors, radius, shadow, size, spacing }) => ({
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.bgSurface,
    ...shadow.card,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: size.avatarS,
    height: size.avatarS,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: colors.bgBrandSoft,
  },
  flex: { flex: 1 },
  product: { gap: 2 },
  box: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.bgSubtle,
  },
}));
