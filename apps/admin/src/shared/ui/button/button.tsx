import { type ReactNode, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  type StyleProp,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { makeStyles, type TypographyVariant, useTheme } from '../theme';
import { Typography } from '../typography';

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  /** navy: 단색 + 그림자(로그인), brand: 그라디언트(주요 액션). */
  variant?: 'navy' | 'brand';
  /** 라벨 왼쪽 아이콘. 로딩 중에는 인디케이터로 바뀐다. */
  leftIcon?: ReactNode;
  /** 라벨 타이포. 시안마다 버튼 글자 스타일이 달라 열어 둔다. */
  labelVariant?: TypographyVariant;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

// Figma Button 채움: linear-gradient(170.63deg, start 14.184%, end 85.106%)
const BRAND_GRADIENT_ANGLE = (170.63 * Math.PI) / 180;
const BRAND_GRADIENT_STOPS = { start: 0.14184, end: 0.85106 };

/** CSS linear-gradient 와 같은 방향·길이의 그라디언트 선을 px 좌표로 구한다. */
function BrandGradient({ width, height }: { width: number; height: number }) {
  const { colors } = useTheme();
  const dx = Math.sin(BRAND_GRADIENT_ANGLE);
  const dy = -Math.cos(BRAND_GRADIENT_ANGLE);
  const half = (Math.abs(width * dx) + Math.abs(height * dy)) / 2;

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient
          id="brand"
          gradientUnits="userSpaceOnUse"
          x1={width / 2 - dx * half}
          y1={height / 2 - dy * half}
          x2={width / 2 + dx * half}
          y2={height / 2 + dy * half}
        >
          <Stop offset={BRAND_GRADIENT_STOPS.start} stopColor={colors.bgBrandStart} />
          <Stop offset={BRAND_GRADIENT_STOPS.end} stopColor={colors.bgBrandEnd} />
        </LinearGradient>
      </Defs>
      <Rect width={width} height={height} fill="url(#brand)" />
    </Svg>
  );
}

export function Button({
  label,
  variant = 'navy',
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
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const isDisabled = disabled === true || loading;
  const isBrand = variant === 'brand';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      {...props}
      disabled={isDisabled}
      onLayout={
        isBrand
          ? ({ nativeEvent }) =>
              setLayout({ width: nativeEvent.layout.width, height: nativeEvent.layout.height })
          : undefined
      }
      style={({ pressed }) => [
        styles.container,
        isBrand ? styles.brand : styles.navy,
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {isBrand && layout.width > 0 && <BrandGradient {...layout} />}
      {loading ? (
        <ActivityIndicator
          color={isBrand ? colors.textOnBrand : colors.textOnNavy}
          style={styles.icon}
        />
      ) : (
        leftIcon
      )}
      <Typography
        variant={labelVariant}
        color={isBrand ? 'textOnBrand' : 'textOnNavy'}
        numberOfLines={1}
      >
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
    borderRadius: radius.lg,
  },
  navy: {
    height: size.buttonL,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.bgNavy,
    ...shadow.card,
  },
  // 그라디언트가 그려지기 전(첫 레이아웃 전)에는 끝 색 단색으로 보인다.
  brand: {
    height: size.buttonM,
    paddingHorizontal: spacing['2xl'],
    backgroundColor: colors.bgBrandEnd,
    overflow: 'hidden',
  },
  pressed: { opacity: opacity.pressed },
  disabled: { opacity: opacity.disabled },
  icon: { width: size.iconM, height: size.iconM },
}));
