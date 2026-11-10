import { View } from 'react-native';

import { type ColorToken, makeStyles } from '../theme';
import { Typography } from '../typography';

export type BadgeTone = 'brand' | 'success' | 'danger';

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
}

const toneColors: Record<
  BadgeTone,
  { bg: 'bgBrandSoft' | 'bgSuccessSoft' | 'bgDangerSoft'; text: ColorToken }
> = {
  brand: { bg: 'bgBrandSoft', text: 'textBrand' },
  success: { bg: 'bgSuccessSoft', text: 'textSuccess' },
  danger: { bg: 'bgDangerSoft', text: 'textDanger' },
};

export function Badge({ label, tone = 'brand' }: BadgeProps) {
  const styles = useStyles();
  const { bg, text } = toneColors[tone];

  return (
    <View style={[styles.container, styles[bg]]}>
      <Typography variant="bodyMStrong" color={text} numberOfLines={1}>
        {label}
      </Typography>
    </View>
  );
}

const useStyles = makeStyles(({ colors, radius, spacing }) => ({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  bgBrandSoft: { backgroundColor: colors.bgBrandSoft },
  bgSuccessSoft: { backgroundColor: colors.bgSuccessSoft },
  bgDangerSoft: { backgroundColor: colors.bgDangerSoft },
}));
