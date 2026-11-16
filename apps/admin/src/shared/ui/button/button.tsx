import { type ReactNode, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { BrandGradient } from '../brand-surface';
import { type ColorToken, makeStyles, type TypographyVariant, useTheme } from '../theme';
import { Typography } from '../typography';

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  /** navy: 단색 + 그림자(로그인), brand: 그라디언트(주요 액션), soft: 연한 브랜드 배경(보조 액션). */
  variant?: 'navy' | 'brand' | 'soft';
  /** small: 카드 안에 들어가는 낮은 버튼. */
  size?: 'regular' | 'small';
  /** 라벨 왼쪽 아이콘. 로딩 중에는 인디케이터로 바뀐다. */
  leftIcon?: ReactNode;
  /** 라벨 타이포. 시안마다 버튼 글자 스타일이 달라 열어 둔다. */
  labelVariant?: TypographyVariant;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

// Figma Button 채움 각도. 버튼 비율에 따라 시안 값이 다르다.
const BRAND_GRADIENT_ANGLE = { regular: 170.63, small: 172.06 };

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** 누르는 동안 줄어드는 비율. 떼면 살짝 튕기며 돌아온다. */
const PRESSED_SCALE = 0.97;
const PRESS_IN_SPRING = { stiffness: 600, damping: 40, mass: 1 };
const PRESS_OUT_SPRING = { stiffness: 400, damping: 18, mass: 1 };

const LABEL_COLOR: Record<NonNullable<ButtonProps['variant']>, ColorToken> = {
  navy: 'textOnNavy',
  brand: 'textOnBrand',
  soft: 'textBrand',
};

export function Button({
  label,
  variant = 'navy',
  size = 'regular',
  leftIcon,
  labelVariant = size === 'small' ? 'buttonM' : 'buttonL',
  loading = false,
  disabled,
  accessibilityLabel,
  style,
  ...props
}: ButtonProps) {
  const styles = useStyles();
  const { colors, opacity } = useTheme();
  const reduceMotion = useReducedMotion();
  const pressProgress = useSharedValue(0);
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const isDisabled = disabled === true || loading;
  const isBrand = variant === 'brand';
  const labelColor = LABEL_COLOR[variant];

  // '동작 줄이기'를 켠 사용자에게는 크기 변화 대신 투명도로만 눌림을 보여 준다.
  const pressStyle = useAnimatedStyle(() =>
    reduceMotion
      ? { opacity: interpolate(pressProgress.get(), [0, 1], [1, opacity.pressed]) }
      : { transform: [{ scale: interpolate(pressProgress.get(), [0, 1], [1, PRESSED_SCALE]) }] },
  );

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      {...props}
      disabled={isDisabled}
      onLayout={(event) => {
        if (isBrand) {
          const { width, height } = event.nativeEvent.layout;
          setLayout((prev) =>
            prev.width === width && prev.height === height ? prev : { width, height },
          );
        }
        props.onLayout?.(event);
      }}
      onPressIn={(event) => {
        pressProgress.set(reduceMotion ? 1 : withSpring(1, PRESS_IN_SPRING));
        props.onPressIn?.(event);
      }}
      onPressOut={(event) => {
        pressProgress.set(reduceMotion ? 0 : withSpring(0, PRESS_OUT_SPRING));
        props.onPressOut?.(event);
      }}
      style={[
        styles.container,
        styles[variant],
        size === 'small' && styles.small,
        isDisabled && styles.disabled,
        style,
        pressStyle,
      ]}
    >
      {isBrand && layout.width > 0 && (
        <BrandGradient {...layout} angle={BRAND_GRADIENT_ANGLE[size]} />
      )}
      {loading ? <ActivityIndicator color={colors[labelColor]} style={styles.icon} /> : leftIcon}
      <Typography variant={labelVariant} color={labelColor} numberOfLines={1}>
        {label}
      </Typography>
    </AnimatedPressable>
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
    zIndex: 0,
  },
  soft: {
    height: size.buttonM,
    paddingHorizontal: spacing['2xl'],
    backgroundColor: colors.bgBrandSoft,
  },
  small: { height: size.buttonS, borderRadius: radius.md },
  disabled: { opacity: opacity.disabled },
  icon: { width: size.iconM, height: size.iconM },
}));
