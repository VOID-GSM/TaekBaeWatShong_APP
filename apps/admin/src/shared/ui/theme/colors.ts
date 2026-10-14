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
  grey50: '#f1f3fa',
  grey200: '#e3e6f2',
  indigo500: '#4f5ed8',
  indigo700: '#3a47be',
  green100: '#dcfce7',
  green700: '#15803d',
} as const;

export const lightColors = {
  /** color/bg-app */
  bgApp: palette.grey50,
  /** color/bg-surface */
  bgSurface: palette.white,
  /** color/bg-navy */
  bgNavy: palette.navy700,
  /** color/bg-brand-soft */
  bgBrandSoft: palette.indigo50,
  /** color/bg-success-soft */
  bgSuccessSoft: palette.green100,
  /** 브랜드 버튼 그라디언트 시작·끝 (Figma Button 채움) */
  bgBrandStart: palette.indigo500,
  bgBrandEnd: palette.indigo700,
  /** color/border-default */
  borderDefault: palette.grey200,
  /** color/text-primary */
  textPrimary: palette.navy900,
  /** color/text-secondary */
  textSecondary: palette.slate500,
  /** color/text-tertiary */
  textTertiary: palette.slate400,
  /** color/text-brand */
  textBrand: palette.indigo600,
  /** color/text-success */
  textSuccess: palette.green700,
  /** color/text-on-brand */
  textOnBrand: palette.white,
  /** bg-navy 위에 올라가는 글자·인디케이터 */
  textOnNavy: palette.white,
  /** color/icon-strong */
  iconStrong: palette.navy900,
  /** 에러 문구. Figma 변수에 없어 임의로 정한 값 — 디자이너 확인 필요. */
  textDanger: palette.red600,
} as const;

export type ColorTokens = { readonly [K in keyof typeof lightColors]: string };
export type ColorToken = keyof ColorTokens;

/** 다크 시안이 아직 없어 라이트와 같은 값을 쓴다. 시안이 나오면 여기 값만 바꾼다. */
export const darkColors: ColorTokens = lightColors;
