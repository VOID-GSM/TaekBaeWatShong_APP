import { View } from 'react-native';

import { GradientView, makeStyles, Typography } from '@/shared/ui';

import type { Zone } from '../model/zone';

/** 보관 수가 0 이면 비활성(회색) 타일로 보인다. */
export function ZoneTile({ zone }: { zone: Zone }) {
  const styles = useStyles();
  const isEmpty = zone.count === 0;
  const letter = (
    <Typography variant="bodyMStrong" color="textOnBrand">
      {zone.letter}
    </Typography>
  );

  return (
    <View
      style={[styles.tile, isEmpty ? styles.tileEmpty : styles.tileActive]}
      accessible
      accessibilityLabel={`${zone.letter}구역 보관 중 ${zone.count}개`}
    >
      {isEmpty ? (
        <View style={[styles.letterBox, styles.letterBoxEmpty]}>{letter}</View>
      ) : (
        <GradientView gradient="brand" style={styles.letterBox}>
          {letter}
        </GradientView>
      )}
      <View style={styles.col}>
        <Typography variant="bodyMStrong" color="textTertiary">
          보관 중
        </Typography>
        <Typography variant="bodyMStrong" color={isEmpty ? 'textTertiary' : 'textPrimary'}>
          {zone.count}개
        </Typography>
      </View>
    </View>
  );
}

const useStyles = makeStyles(({ colors, radius, shadow, size, spacing }) => ({
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingLeft: spacing.md,
    paddingRight: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    ...shadow.card,
  },
  tileActive: { backgroundColor: colors.bgSurface, borderColor: colors.borderBrand },
  tileEmpty: { backgroundColor: colors.bgNeutralSoft, borderColor: 'transparent' },
  letterBox: {
    width: size.iconButton,
    height: size.iconButton,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  letterBoxEmpty: { backgroundColor: colors.borderStrong },
  col: { flex: 1 },
}));
