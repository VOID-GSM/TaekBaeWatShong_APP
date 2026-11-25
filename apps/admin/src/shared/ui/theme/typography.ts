import type { TextStyle } from 'react-native';

import { fontFamily } from './fonts';

/** Figma 텍스트 스타일(Noto Sans KR). 이름은 Figma 스타일 이름을 따른다. */
export const typography = {
  titlePage: { fontFamily: fontFamily.regular, fontSize: 22, lineHeight: 30 },
  headingH1: { fontFamily: fontFamily.regular, fontSize: 18, lineHeight: 26 },
  headingH2: { fontFamily: fontFamily.regular, fontSize: 16, lineHeight: 24 },
  bodyL: { fontFamily: fontFamily.regular, fontSize: 16, lineHeight: 24 },
  bodyM: { fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 22 },
  bodyMStrong: { fontFamily: fontFamily.bold, fontSize: 14, lineHeight: 22 },
  caption: { fontFamily: fontFamily.regular, fontSize: 12, lineHeight: 18 },
  micro: { fontFamily: fontFamily.regular, fontSize: 11, lineHeight: 16 },
  buttonL: { fontFamily: fontFamily.regular, fontSize: 16, lineHeight: 24 },
  buttonM: { fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 20 },
  /**
   * 노트북·태블릿 화면을 멀리서 보는 결과 표시용 (택배 스캔). Figma 스타일 없음 — 디자이너 확인 필요.
   */
  displayXL: { fontFamily: fontFamily.bold, fontSize: 48, lineHeight: 60 },
  displayL: { fontFamily: fontFamily.bold, fontSize: 32, lineHeight: 44 },
  displayM: { fontFamily: fontFamily.regular, fontSize: 24, lineHeight: 34 },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
