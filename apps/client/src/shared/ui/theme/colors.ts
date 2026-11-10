/** Figma 변수(color/*) 원본 값. 컴포넌트에서는 아래 의미 토큰만 쓴다. */
const palette = {
  white: '#ffffff',
  white75: 'rgba(255, 255, 255, 0.75)',
  navy700: '#20265a',
  navy900: '#1a1f4b',
  indigo50: '#eef0ff',
  indigo100: '#e1e5ff',
  indigo300: '#a5aef2',
  indigo600: '#4352cf',
  indigo800: '#272f85',
  slate50: '#f7f8fd',
  slate75: '#f1f3fa',
  slate100: '#eef0f8',
  slate200: '#e3e6f2',
  slate300: '#cdd2e6',
  slate400: '#9aa1bf',
  slate500: '#6e7595',
  red100: '#fee2e2',
  red600: '#dc2626',
  green100: '#dcfce7',
  green600: '#16a34a',
  green700: '#15803d',
  amber100: '#fef3c7',
  amber700: '#b45309',
} as const;

export const lightColors = {
  bgApp: palette.slate75,
  bgSurface: palette.white,
  bgSubtle: palette.slate50,
  bgNeutralSoft: palette.slate100,
  bgNavy: palette.navy700,
  bgBrandSoft: palette.indigo50,
  bgBrandSofter: palette.indigo100,
  bgDangerSoft: palette.red100,
  bgSuccessSoft: palette.green100,
  bgWarningSoft: palette.amber100,

  textPrimary: palette.navy900,
  textSecondary: palette.slate500,
  textTertiary: palette.slate400,
  textBrand: palette.indigo600,
  textBrandStrong: palette.indigo800,
  textOnNavy: palette.white,
  textOnBrand: palette.white,
  /** 브랜드 그라데이션 위 보조 문구. Figma 에 변수 없이 rgba(255,255,255,0.75) 로 쓰였다. */
  textOnBrandMuted: palette.white75,
  textDanger: palette.red600,
  textSuccess: palette.green700,
  textWarning: palette.amber700,

  borderDefault: palette.slate200,
  borderStrong: palette.slate300,
  borderBrand: palette.indigo300,
  borderDanger: palette.red600,
  borderFocus: palette.indigo600,

  iconStrong: palette.navy900,
  iconDefault: palette.slate500,
  iconMuted: palette.slate400,
  iconBrand: palette.indigo600,
  iconOnBrand: palette.white,

  statusDanger: palette.red600,
  statusSuccess: palette.green600,
} as const;

export type ColorTokens = { readonly [K in keyof typeof lightColors]: string };
export type ColorToken = keyof ColorTokens;

/** 다크 시안이 아직 없어 라이트와 같은 값을 쓴다. 시안이 나오면 여기 값만 바꾼다. */
export const darkColors: ColorTokens = lightColors;

/** Figma 그라데이션 채우기. 좌상단 → 우하단(navy 는 위 → 아래). */
export const gradients = {
  brand: { from: '#4f5ed8', to: '#3a47be', start: 0.14184, end: 0.85106, direction: 'diagonal' },
  navy: { from: '#272e6e', to: '#161a42', start: 0, end: 1, direction: 'vertical' },
} as const;

export type GradientToken = keyof typeof gradients;
