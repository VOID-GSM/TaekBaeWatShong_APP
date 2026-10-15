import type { TextStyle } from 'react-native';

import { fontFamily } from './fonts';

/** Figma 텍스트 스타일(Noto Sans KR). 이름은 Figma 스타일 이름을 따른다. */
export const typography = {
  titlePage: { fontFamily: fontFamily.regular, fontSize: 22, lineHeight: 30 },
  headingH2: { fontFamily: fontFamily.regular, fontSize: 16, lineHeight: 24 },
  bodyL: { fontFamily: fontFamily.regular, fontSize: 16, lineHeight: 24 },
  bodyM: { fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 22 },
  bodyMStrong: { fontFamily: fontFamily.bold, fontSize: 14, lineHeight: 22 },
  caption: { fontFamily: fontFamily.regular, fontSize: 12, lineHeight: 18 },
  buttonL: { fontFamily: fontFamily.regular, fontSize: 16, lineHeight: 24 },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
