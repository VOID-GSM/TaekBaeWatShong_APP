import { View } from 'react-native';

import { Card, makeStyles, Typography } from '@/shared/ui';

export interface ClaimedParcelRowProps {
  /** 4자리씩 띄운 운송장 번호 */
  invoiceNumber: string;
  /** 예: '최서준 · 도착 07.07 10:10' */
  meta: string;
  /** 회수 후 지난 시간. 예: '00:00:12' */
  elapsed: string;
  /** 보관 구역 문자. 미배정이면 없다. */
  zone?: string | null;
}

/** 방금 회수한 택배 한 줄 (Figma `ParcelRow` · Arrived). */
export function ClaimedParcelRow({ invoiceNumber, meta, elapsed, zone }: ClaimedParcelRowProps) {
  const styles = useStyles();

  return (
    <Card rounded="lg" style={styles.row}>
      <View style={styles.info}>
        <Typography numberOfLines={1}>{invoiceNumber}</Typography>
        <Typography variant="caption" color="textSecondary" numberOfLines={1}>
          {meta}
        </Typography>
      </View>
      <View style={styles.right}>
        <Typography
          color="textDanger"
          accessibilityLabel={`회수 후 ${elapsed} 지남`}
          style={styles.tabular}
        >
          {elapsed}
        </Typography>
        {zone ? (
          <View style={styles.zone}>
            <Typography variant="caption" color="textBrand">
              {zone}구역
            </Typography>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

const useStyles = makeStyles(({ colors, radius, spacing }) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  info: { flex: 1, gap: spacing['2xs'] },
  right: { alignItems: 'flex-end', gap: spacing.xs },
  // 초마다 바뀌는 숫자 폭이 흔들리지 않게 한다.
  tabular: { fontVariant: ['tabular-nums'] },
  zone: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing['2xs'],
    borderRadius: radius.full,
    backgroundColor: colors.bgBrandSoft,
  },
}));
