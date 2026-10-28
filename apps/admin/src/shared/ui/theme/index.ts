import { useMemo } from 'react';
import {
  type ImageStyle,
  StyleSheet,
  type TextStyle,
  useColorScheme,
  type ViewStyle,
} from 'react-native';

import { type ColorToken, type ColorTokens, darkColors, lightColors } from './colors';
import { fontAssets, fontFamily } from './fonts';
import { motion, opacity, radius, shadow, size, spacing } from './spacing';
import { typography, type TypographyVariant } from './typography';

export function useTheme() {
  const scheme = useColorScheme();

  return useMemo(
    () => ({
      colors: scheme === 'dark' ? darkColors : lightColors,
      typography,
      spacing,
      radius,
      size,
      opacity,
      shadow,
      motion,
      scheme,
    }),
    [scheme],
  );
}

export type Theme = ReturnType<typeof useTheme>;

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

/** 색상처럼 테마에 따라 바뀌는 스타일용. 컴포넌트 바깥에서 정의하고 안에서 호출한다. */
export function makeStyles<T extends NamedStyles<T>>(factory: (theme: Theme) => T) {
  return function useStyles() {
    const theme = useTheme();
    return useMemo(() => StyleSheet.create(factory(theme)), [theme]);
  };
}

export {
  type ColorToken,
  type ColorTokens,
  fontAssets,
  fontFamily,
  motion,
  opacity,
  radius,
  shadow,
  size,
  spacing,
  typography,
  type TypographyVariant,
};
