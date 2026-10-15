import { type StyleProp, View, type ViewProps, type ViewStyle } from 'react-native';

import { makeStyles } from '../theme';
import { Typography } from '../typography';

export interface BadgeProps extends Omit<ViewProps, 'children' | 'style'> {
  label: string;
  tone?: 'brand' | 'success';
  style?: StyleProp<ViewStyle>;
}

export function Badge({ label, tone = 'brand', style, ...props }: BadgeProps) {
  const styles = useStyles();
  const isSuccess = tone === 'success';

  return (
    <View {...props} style={[styles.container, isSuccess && styles.success, style]}>
      <Typography
        variant="caption"
        color={isSuccess ? 'textSuccess' : 'textBrand'}
        numberOfLines={1}
      >
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
    backgroundColor: colors.bgBrandSoft,
  },
  success: { backgroundColor: colors.bgSuccessSoft },
}));
