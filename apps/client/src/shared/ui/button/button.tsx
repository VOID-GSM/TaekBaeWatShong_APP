import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  type StyleProp,
  StyleSheet,
  type ViewStyle,
} from 'react-native';

import { BrandSurface } from '../brand-surface';
import { type ColorToken, makeStyles, type TypographyVariant, useTheme } from '../theme';
import { Typography } from '../typography';

/** navy: 로그인 등 주 버튼 · brand: 브랜드 그라데이션 · dangerSoft: 연한 빨강(분실 신고 등) */
export type ButtonVariant = 'navy' | 'brand' | 'dangerSoft';
/** l: 높이 56 · m: 높이 40(카드 안 버튼) */
export type ButtonSize = 'l' | 'm';

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** 라벨 왼쪽 아이콘. 로딩 중에는 인디케이터로 바뀐다. */
  leftIcon?: ReactNode;
  /** 라벨 타이포. 시안마다 버튼 글자 스타일이 달라 열어 둔다. */
  labelVariant?: TypographyVariant;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

const labelColors: Record<ButtonVariant, ColorToken> = {
  navy: 'textOnNavy',
  brand: 'textOnBrand',
  dangerSoft: 'textDanger',
};

export function Button({
  label,
  variant = 'navy',
  size = 'l',
  leftIcon,
  labelVariant = size === 'm' ? 'bodyMStrong' : 'buttonL',
  loading = false,
  disabled,
  accessibilityLabel,
  style,
  ...props
}: ButtonProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const isDisabled = disabled === true || loading;
  const labelColor = labelColors[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      {...props}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.container,
        styles[size],
        styles[variant],
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {/* 각도는 Figma 카드 버튼 값 */}
      {variant === 'brand' && <BrandSurface angle={164} style={StyleSheet.absoluteFill} />}
      {loading ? <ActivityIndicator color={colors[labelColor]} style={styles.icon} /> : leftIcon}
      <Typography variant={labelVariant} color={labelColor} numberOfLines={1}>
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
    overflow: 'hidden',
  },
  l: {
    height: size.buttonL,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
  },
  m: {
    height: size.buttonM,
    paddingHorizontal: spacing['2xl'],
    borderRadius: radius.md,
  },
  navy: { backgroundColor: colors.bgNavy, ...shadow.card },
  brand: {},
  dangerSoft: { backgroundColor: colors.bgDangerSoft },
  pressed: { opacity: opacity.pressed },
  disabled: { opacity: opacity.disabled },
  icon: { width: size.iconM, height: size.iconM },
}));
