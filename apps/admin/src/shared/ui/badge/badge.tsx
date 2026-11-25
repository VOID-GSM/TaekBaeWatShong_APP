import { type StyleProp, View, type ViewProps, type ViewStyle } from 'react-native';

import { type ColorToken, makeStyles } from '../theme';
import { Typography } from '../typography';

type BadgeTone = 'brand' | 'success' | 'warning' | 'danger';

export interface BadgeProps extends Omit<ViewProps, 'children' | 'style'> {
  label: string;
  tone?: BadgeTone;
  style?: StyleProp<ViewStyle>;
}

const LABEL_COLOR: Record<BadgeTone, ColorToken> = {
  brand: 'textBrand',
  success: 'textSuccess',
  warning: 'textWarning',
  danger: 'textDanger',
};

export function Badge({ label, tone = 'brand', style, ...props }: BadgeProps) {
  const styles = useStyles();

  return (
    <View {...props} style={[styles.container, styles[tone], style]}>
      <Typography variant="caption" color={LABEL_COLOR[tone]} numberOfLines={1}>
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
  brand: { backgroundColor: colors.bgBrandSoft },
  success: { backgroundColor: colors.bgSuccessSoft },
  warning: { backgroundColor: colors.bgWarningSoft },
  danger: { backgroundColor: colors.bgDangerSoft },
}));
