import type { TextStyle } from 'react-native';

import { fontFamily } from './fonts';

/** Figma 텍스트 스타일(Noto Sans KR). 이름은 Figma 스타일 이름을 따른다. */
export const typography = {
  /** Title/Page */
  titlePage: { fontFamily: fontFamily.regular, fontSize: 22, lineHeight: 30 },
  /** Heading/H2 */
  headingH2: { fontFamily: fontFamily.regular, fontSize: 16, lineHeight: 24 },
  /** Body/L */
  bodyL: { fontFamily: fontFamily.regular, fontSize: 16, lineHeight: 24 },
  /** Body/M */
  bodyM: { fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 22 },
  /** Body/M-Strong */
  bodyMStrong: { fontFamily: fontFamily.bold, fontSize: 14, lineHeight: 22 },
  /** Caption */
  caption: { fontFamily: fontFamily.regular, fontSize: 12, lineHeight: 18 },
  /** Button/L */
  buttonL: { fontFamily: fontFamily.regular, fontSize: 16, lineHeight: 24 },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
