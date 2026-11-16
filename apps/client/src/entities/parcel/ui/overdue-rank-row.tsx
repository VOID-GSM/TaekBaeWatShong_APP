import { View } from 'react-native';

import { BrandSurface, Card, makeStyles, Typography } from '@/shared/ui';

import type { OverdueRank } from '../model/parcel';

export function OverdueRankRow({ item }: { item: OverdueRank }) {
  const styles = useStyles();

  return (
    <Card rounded="lg" style={styles.row}>
      <RankCircle rank={item.rank} />
      <View style={styles.col}>
        <Typography variant="bodyMStrong" numberOfLines={1}>
          {item.ownerName}
        </Typography>
        <Typography variant="bodyMStrong" color="textSecondary" numberOfLines={1}>
          {item.parcelName} · {item.zone}구역
        </Typography>
      </View>
      <View style={styles.timeCol}>
        <Typography variant="bodyMStrong" color="textDanger">
          {item.overdueFor}
        </Typography>
        <Typography variant="bodyMStrong" color="textTertiary">
          방치 중
        </Typography>
      </View>
    </Card>
  );
}

/** 1위 navy · 2위 brand 그라데이션 · 3위 이하 연한 브랜드 */
function RankCircle({ rank }: { rank: number }) {
  const styles = useStyles();
  const label = (
    <Typography variant="bodyMStrong" color={rank <= 2 ? 'textOnBrand' : 'textBrand'}>
      {rank}
    </Typography>
  );

  if (rank <= 2) {
    return (
      // navy 는 위 → 아래, brand 는 Figma 원형 배지 각도
      <BrandSurface
        gradient={rank === 1 ? 'navy' : 'brand'}
        angle={rank === 1 ? 180 : 131.35}
        style={styles.rank}
      >
        {label}
      </BrandSurface>
    );
  }
  return <View style={[styles.rank, styles.rankSoft]}>{label}</View>;
}

const useStyles = makeStyles(({ colors, radius, spacing }) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rank: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  rankSoft: { backgroundColor: colors.bgBrandSofter },
  col: { flex: 1, gap: spacing['2xs'] },
  timeCol: { alignItems: 'flex-end' },
}));
