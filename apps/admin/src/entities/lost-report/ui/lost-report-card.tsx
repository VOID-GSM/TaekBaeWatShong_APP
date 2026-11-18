import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Badge, makeStyles, Typography } from '@/shared/ui';

import { formatLostAt, formatReporter, formatWaybill } from '../lib/format';
import { getLostReportState, type LostReport, type LostReportState } from '../model/lost-report';

const BADGE: Record<LostReportState, { label: string; tone: 'danger' | 'brand' | 'success' }> = {
  new: { label: '분실 신고', tone: 'danger' },
  chatRequested: { label: '채팅 요청', tone: 'brand' },
  done: { label: '처리 완료', tone: 'success' },
};

export interface LostReportCardProps {
  report: LostReport;
  /** 카드 맨 아래 버튼 자리. 채팅 시작·열기처럼 사용자 행동은 바깥 계층이 넣는다. */
  action?: ReactNode;
}

/** 분실 신고 한 건 (Figma `ReportCard`). */
export function LostReportCard({ report, action }: LostReportCardProps) {
  const styles = useStyles();
  const badge = BADGE[getLostReportState(report)];

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
          <Typography color="textBrand">{report.reporterName.slice(0, 1)}</Typography>
        </View>
        <Typography style={styles.flex}>{formatReporter(report)}</Typography>
        <Badge label={badge.label} tone={badge.tone} />
      </View>

      <View style={styles.product}>
        <Typography variant="headingH2">{report.alias}</Typography>
        <Typography variant="caption" color="textSecondary">
          {formatWaybill(report)}
        </Typography>
      </View>

      <View style={styles.box}>
        <Typography variant="micro" color="textTertiary">
          분실 예상 시각
        </Typography>
        <Typography>{formatLostAt(report.lostEstimatedAt)}</Typography>
      </View>

      {/* 목록 응답에 신고 내용이 아직 없다(SERVER#26) — 오면 보여 준다. */}
      {report.content ? <Typography color="textSecondary">{report.content}</Typography> : null}

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
