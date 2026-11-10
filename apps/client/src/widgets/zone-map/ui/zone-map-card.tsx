import { View } from 'react-native';

import { type Zone, ZoneTile } from '@/entities/zone';
import { Badge, Card, Icon, makeStyles, Typography } from '@/shared/ui';

export interface ZoneMapCardProps {
  leftShelf: Zone[];
  rightShelf: Zone[];
}

/** 택배 보관 구역 약도 — 왼쪽/오른쪽 선반의 구역별 보관 수. */
export function ZoneMapCard({ leftShelf, rightShelf }: ZoneMapCardProps) {
  const styles = useStyles();
  const total = [...leftShelf, ...rightShelf].reduce((sum, zone) => sum + zone.count, 0);
  const shelfOrder = `${leftShelf.map((z) => z.letter).join('·')} / ${rightShelf
    .map((z) => z.letter)
    .join('·')}`;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Icon name="map" />
        <Typography variant="bodyMStrong" accessibilityRole="header" style={styles.flex}>
          택배 보관 구역
        </Typography>
        <Badge label={`${total}개 보관 중`} tone="brand" />
      </View>

      <View style={styles.shelves}>
        <Shelf title="왼쪽 선반" zones={leftShelf} />
        <Shelf title="오른쪽 선반" zones={rightShelf} />
      </View>

      <View style={styles.note}>
        <Icon name="infoMuted" />
        <Typography variant="bodyMStrong" color="textTertiary" style={styles.flex}>
          3층 선반 · 위칸부터 {shelfOrder}
        </Typography>
      </View>
    </Card>
  );
}

function Shelf({ title, zones }: { title: string; zones: Zone[] }) {
  const styles = useStyles();

  return (
    <View style={styles.shelf}>
      <Typography variant="bodyMStrong" color="textSecondary" align="center">
        {title}
      </Typography>
      {zones.map((zone) => (
        <ZoneTile key={zone.letter} zone={zone} />
      ))}
    </View>
  );
}

const useStyles = makeStyles(({ colors, radius, spacing }) => ({
  card: { gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  shelves: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  shelf: {
    flex: 1,
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.bgSubtle,
  },
  note: { flexDirection: 'row', alignItems: 'center', gap: spacing.xsPlus },
  flex: { flex: 1 },
}));
