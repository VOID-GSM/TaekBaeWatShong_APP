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

/** brand 그라디언트 각도. 요소 비율마다 Figma 값이 다르다. (l: 택배 등록 버튼, m: 카드 안 버튼) */
const BRAND_GRADIENT_ANGLE: Record<ButtonSize, number> = { l: 170.63, m: 164 };

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** 누르는 동안 줄어드는 비율. 떼면 살짝 튕기며 돌아온다. */
const PRESSED_SCALE = 0.97;
const PRESS_IN_SPRING = { stiffness: 600, damping: 40, mass: 1 };
const PRESS_OUT_SPRING = { stiffness: 400, damping: 18, mass: 1 };

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
  const { colors, opacity } = useTheme();
  const reduceMotion = useReducedMotion();
  const pressProgress = useSharedValue(0);
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const isDisabled = disabled === true || loading;
  const isBrand = variant === 'brand';
  const labelColor = labelColors[variant];

  // '동작 줄이기'를 켠 사용자에게는 크기 변화 대신 투명도로만 눌림을 보여 준다.
  // 이 스타일이 배열 맨 뒤에서 opacity 를 덮어쓰므로, 비활성 투명도도 여기서 같이 계산한다.
  const baseOpacity = isDisabled ? opacity.disabled : 1;
  const pressStyle = useAnimatedStyle(() =>
    reduceMotion
      ? {
          opacity: interpolate(
            pressProgress.get(),
            [0, 1],
            [baseOpacity, baseOpacity * opacity.pressed],
          ),
        }
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
        styles[size],
        styles[variant],
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
  // 그라디언트가 그려지기 전(첫 레이아웃 전)에는 끝 색 단색으로 보인다.
  // zIndex 0 으로 쌓임 맥락을 만들어 zIndex -1 그라디언트가 배경 밑으로 빠지지 않게 한다.
  brand: { backgroundColor: colors.bgBrandEnd, zIndex: 0 },
  dangerSoft: { backgroundColor: colors.bgDangerSoft },
  disabled: { opacity: opacity.disabled },
  icon: { width: size.iconM, height: size.iconM },
}));
