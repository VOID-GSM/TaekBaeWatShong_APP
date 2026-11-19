import { formatElapsed } from '@taekbae/utils';
import { View } from 'react-native';

import { useNow } from '@/shared/hooks';
import { Card, makeStyles, Typography } from '@/shared/ui';

export interface ClaimedParcelRowProps {
  /** 4자리씩 띄운 운송장 번호 */
  invoiceNumber: string;
  /** 예: '최서준 · 도착 07.07 10:10' */
  meta: string;
  /** 회수 시각. 지난 시간(예: '00:00:12')을 행 안에서 1초마다 갱신한다. */
  claimedAt: Date;
  /** 보관 구역 문자. 미배정이면 없다. */
  zone?: string | null;
}

/** 방금 회수한 택배 한 줄 (Figma `ParcelRow` · Arrived). */
export function ClaimedParcelRow({ invoiceNumber, meta, claimedAt, zone }: ClaimedParcelRowProps) {
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
        <ElapsedText since={claimedAt} />
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

/** 초마다 바뀌는 건 이 글자뿐이라 시계를 여기에 두어 다시 그리는 범위를 줄인다. */
function ElapsedText({ since }: { since: Date }) {
  const styles = useStyles();
  const now = useNow(1000);
  const elapsed = formatElapsed(now.getTime() - since.getTime());

  return (
    <Typography
      color="textDanger"
      accessibilityLabel={`회수 후 ${elapsed} 지남`}
      style={styles.tabular}
    >
      {elapsed}
    </Typography>
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
