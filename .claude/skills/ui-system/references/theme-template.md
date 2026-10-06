# 테마 초기 템플릿

값은 placeholder다. 디자인 시안을 받으면 교체한다. 이미 theme 폴더가 있으면 그 코드가 우선.

## shared/ui/theme/colors.ts

```ts
const palette = {
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#F9FAFB',
  gray100: '#F2F4F6',
  gray300: '#D1D6DB',
  gray500: '#8B95A1',
  gray700: '#4E5968',
  gray900: '#191F28',
  brand500: '#3182F6',
  brand600: '#1B64DA',
  red500: '#F04452',
  green500: '#03B26C',
} as const;

export const lightColors = {
  background: palette.white,
  surface: palette.gray50,
  textPrimary: palette.gray900,
  textSecondary: palette.gray700,
  textTertiary: palette.gray500,
  border: palette.gray100,
  primary: palette.brand500,
  primaryPressed: palette.brand600,
  onPrimary: palette.white,
  danger: palette.red500,
  success: palette.green500,
};

export type ColorTokens = typeof lightColors;

export const darkColors: ColorTokens = {
  background: '#101013',
  surface: '#1C1C21',
  textPrimary: '#F2F4F6',
  textSecondary: '#B0B8C1',
  textTertiary: palette.gray500,
  border: '#2C2C35',
  primary: palette.brand500,
  primaryPressed: palette.brand600,
  onPrimary: palette.white,
  danger: palette.red500,
  success: palette.green500,
};
```

## shared/ui/theme/typography.ts

```ts
import type { TextStyle } from 'react-native';

export const typography = {
  title1: { fontSize: 24, lineHeight: 32, fontWeight: '700' },
  title2: { fontSize: 20, lineHeight: 28, fontWeight: '700' },
  body1: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  body1Bold: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
  body2: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
```

## shared/ui/theme/spacing.ts

```ts
export const spacing = { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40 } as const;
export const radius = { sm: 6, md: 10, lg: 16, full: 9999 } as const;
export const motion = { fast: 150, normal: 250, slow: 400 } as const;

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
} as const;
```

## shared/ui/theme/index.ts

```ts
import { useMemo } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';

import { type ColorTokens, darkColors, lightColors } from './colors';
import { motion, radius, shadow, spacing } from './spacing';
import { typography } from './typography';

export function useTheme() {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? darkColors : lightColors;
  return { colors, typography, spacing, radius, shadow, motion, scheme };
}

export type Theme = ReturnType<typeof useTheme>;

/** 색상처럼 테마에 따라 바뀌는 스타일용. 컴포넌트 바깥에서 정의하고 안에서 호출한다. */
export function makeStyles<T extends StyleSheet.NamedStyles<T>>(factory: (theme: Theme) => T) {
  return function useStyles() {
    const theme = useTheme();
    return useMemo(() => StyleSheet.create(factory(theme)), [theme.scheme]);
  };
}

export { type ColorTokens, motion, radius, shadow, spacing, typography };
```

사용:

```tsx
const useStyles = makeStyles(({ colors, spacing, radius }) => ({
  card: { backgroundColor: colors.surface, padding: spacing[4], borderRadius: radius.md },
}));

export function Card({ children }: PropsWithChildren) {
  const styles = useStyles();
  return <View style={styles.card}>{children}</View>;
}
```
