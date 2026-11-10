import { View } from 'react-native';

import { GradientView, makeStyles, Typography } from '@/shared/ui';

import type { ParcelSummary } from '../model/parcel';

export function ParcelSummaryCard({ summary }: { summary: ParcelSummary }) {
  const styles = useStyles();

  return (
    <GradientView gradient="brand" style={styles.container}>
      <View style={styles.total}>
        <Typography variant="bodyM" color="textOnBrandMuted">
          내 택배
        </Typography>
        <Typography variant="displayNumber" color="textOnBrand">
          {summary.total}개
        </Typography>
      </View>
      <Stat value={summary.arrived} label="도착" />
      <Stat value={summary.overdue} label="방치" />
    </GradientView>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  const styles = useStyles();

  return (
    <View style={styles.stat} accessible accessibilityLabel={`${label} ${value}개`}>
      <Typography variant="titlePage" color="textOnBrand">
        {value}
      </Typography>
      <Typography variant="caption" color="textOnBrandMuted">
        {label}
      </Typography>
    </View>
  );
}

const useStyles = makeStyles(({ radius, spacing }) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: 22,
    borderRadius: radius['2xl'],
  },
  total: { flex: 1, gap: spacing['2xs'] },
  stat: { alignItems: 'center', gap: spacing['2xs'] },
}));
