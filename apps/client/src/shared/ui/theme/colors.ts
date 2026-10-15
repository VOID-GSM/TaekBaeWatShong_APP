/** Figma 변수(color/*) 원본 값. 컴포넌트에서는 아래 의미 토큰만 쓴다. */
const palette = {
  white: '#ffffff',
  navy700: '#20265a',
  navy900: '#1a1f4b',
  indigo50: '#eef0ff',
  indigo600: '#4352cf',
  slate500: '#6e7595',
  slate400: '#9aa1bf',
  red600: '#d93036',
} as const;

export const lightColors = {
  bgSurface: palette.white,
  bgNavy: palette.navy700,
  bgBrandSoft: palette.indigo50,
  textPrimary: palette.navy900,
  textSecondary: palette.slate500,
  textTertiary: palette.slate400,
  textBrand: palette.indigo600,
  textOnNavy: palette.white,
  iconStrong: palette.navy900,
  /** 에러 문구. Figma 변수에 없어 임의로 정한 값 — 디자이너 확인 필요. */
  textDanger: palette.red600,
} as const;

export type ColorTokens = { readonly [K in keyof typeof lightColors]: string };
export type ColorToken = keyof ColorTokens;

/** 다크 시안이 아직 없어 라이트와 같은 값을 쓴다. 시안이 나오면 여기 값만 바꾼다. */
export const darkColors: ColorTokens = lightColors;
