import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { makeStyles, type TypographyVariant, useTheme } from '../theme';
import { Typography } from '../typography';

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  /** 라벨 왼쪽 아이콘. 로딩 중에는 인디케이터로 바뀐다. */
  leftIcon?: ReactNode;
  /** 라벨 타이포. 시안마다 버튼 글자 스타일이 달라 열어 둔다. */
  labelVariant?: TypographyVariant;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  label,
  leftIcon,
  labelVariant = 'buttonL',
  loading = false,
  disabled,
  accessibilityLabel,
  style,
  ...props
}: ButtonProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const isDisabled = disabled === true || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      {...props}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={colors.textOnNavy} style={styles.icon} /> : leftIcon}
      <Typography variant={labelVariant} color="textOnNavy" numberOfLines={1}>
        {label}
      </Typography>
    </Pressable>
  );
}

const useStyles = makeStyles(({ colors, opacity, radius, shadow, size, spacing }) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    gap: spacing.md,
    height: size.buttonL,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.bgNavy,
    ...shadow.card,
  },
  pressed: { opacity: opacity.pressed },
  disabled: { opacity: opacity.disabled },
  icon: { width: size.iconM, height: size.iconM },
}));
