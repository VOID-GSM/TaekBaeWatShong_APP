import { type ReactNode, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { BrandGradient } from '../brand-surface';
import { type ColorToken, makeStyles, type TypographyVariant, useTheme } from '../theme';
import { Typography } from '../typography';

export type ButtonVariant = 'navy' | 'brand' | 'outline';

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  /** 배경 종류. navy(기본) 남색 단색, brand 브랜드 그라디언트, outline 흰 배경 + 테두리. */
  variant?: ButtonVariant;
  /** 라벨 왼쪽 아이콘. 로딩 중에는 인디케이터로 바뀐다. */
  leftIcon?: ReactNode;
  /** 라벨 타이포. 시안마다 버튼 글자 스타일이 달라 열어 둔다. */
  labelVariant?: TypographyVariant;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

const LABEL_COLOR: Record<ButtonVariant, ColorToken> = {
  navy: 'textOnNavy',
  brand: 'textOnBrand',
  outline: 'textPrimary',
};

/** 브랜드 버튼(C9 "분실 신고 제출")의 그라디언트 각도. 스크린샷 추정 — 디자이너 확인 필요. */
const BRAND_ANGLE = 135;

export function Button({
  label,
  variant = 'navy',
  leftIcon,
  labelVariant = 'buttonL',
  loading = false,
  disabled,
  accessibilityLabel,
  onLayout,
  style,
  ...props
}: ButtonProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const isDisabled = disabled === true || loading;
  const labelColor = LABEL_COLOR[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      {...props}
      disabled={isDisabled}
      onLayout={(event) => {
        if (variant === 'brand') {
          const { width, height } = event.nativeEvent.layout;
          setLayout((prev) =>
            prev.width === width && prev.height === height ? prev : { width, height },
          );
        }
        onLayout?.(event);
      }}
      style={({ pressed }) => [
        styles.container,
        styles[variant],
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {variant === 'brand' && layout.width > 0 && (
        <BrandGradient width={layout.width} height={layout.height} angle={BRAND_ANGLE} />
      )}
      {loading ? <ActivityIndicator color={colors[labelColor]} style={styles.icon} /> : leftIcon}
      <Typography variant={labelVariant} color={labelColor} numberOfLines={1}>
        {label}
      </Typography>
    </Pressable>
  );
}

const useStyles = makeStyles(({ borderWidth, colors, opacity, radius, shadow, size, spacing }) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    gap: spacing.md,
    height: size.buttonL,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
  },
  navy: { backgroundColor: colors.bgNavy, ...shadow.card },
  // 첫 레이아웃 전에는 끝 색 단색. zIndex 0 으로 쌓임 맥락을 만들어 그라디언트(zIndex -1)가 배경 밑으로 빠지지 않게 한다.
  brand: { backgroundColor: colors.bgBrandEnd, overflow: 'hidden', zIndex: 0 },
  outline: {
    backgroundColor: colors.bgSurface,
    borderWidth: borderWidth.thin,
    borderColor: colors.borderDefault,
  },
  pressed: { opacity: opacity.pressed },
  disabled: { opacity: opacity.disabled },
  icon: { width: size.iconM, height: size.iconM },
}));
