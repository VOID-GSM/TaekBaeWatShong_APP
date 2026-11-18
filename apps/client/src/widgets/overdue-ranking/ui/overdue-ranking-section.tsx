import { View } from 'react-native';

import { type OverdueRank, OverdueRankRow } from '@/entities/parcel';
import { Icon, makeStyles, Typography } from '@/shared/ui';

export interface OverdueRankingSectionProps {
  ranks: OverdueRank[];
}

/** 가져가지 않은 택배 TOP 3 — 제목·설명과 방치 순위 행. */
export function OverdueRankingSection({ ranks }: OverdueRankingSectionProps) {
  const styles = useStyles();

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Icon name="alert" />
        <Typography variant="bodyMStrong" accessibilityRole="header" style={styles.flex}>
          가져가지 않은 택배 TOP 3
        </Typography>
      </View>
      <Typography variant="bodyMStrong" color="textSecondary">
        방치 1일 초과 시 방치자로 집계되어 순위에 올라가요
      </Typography>

      {ranks.length === 0 ? (
        <Typography variant="bodyMStrong" color="textTertiary" align="center">
          방치된 택배가 없어요.
        </Typography>
      ) : (
        ranks.map((item) => <OverdueRankRow key={item.rank} item={item} />)
      )}
    </View>
  );
}

const useStyles = makeStyles(({ spacing }) => ({
  section: { gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
}));
