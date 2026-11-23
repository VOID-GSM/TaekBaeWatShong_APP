/** Figma 변수(color/*) 원본 값. 컴포넌트에서는 아래 의미 토큰만 쓴다. */
const palette = {
  white: '#ffffff',
  navy700: '#20265a',
  navy900: '#1a1f4b',
  indigo50: '#eef0ff',
  indigo600: '#4352cf',
  slate500: '#6e7595',
  slate400: '#9aa1bf',
  red100: '#fee2e2',
  red600: '#dc2626',
  grey25: '#f7f8fd',
  grey50: '#f1f3fa',
  grey200: '#e3e6f2',
  indigo500: '#4f5ed8',
  indigo700: '#3a47be',
  green100: '#dcfce7',
  green700: '#15803d',
  grey100: '#eef0f8',
  indigo200: '#a5aef2',
  indigo800: '#272f85',
} as const;

export const lightColors = {
  bgApp: palette.grey50,
  bgSurface: palette.white,
  bgNavy: palette.navy700,
  bgBrandSoft: palette.indigo50,
  bgSuccessSoft: palette.green100,
  bgDangerSoft: palette.red100,
  /** 카드 안 보조 정보 상자 */
  bgSubtle: palette.grey25,
  /** 세그먼트 컨트롤 트랙 */
  bgNeutralSoft: palette.grey100,
  /** 카메라 뷰파인더 배경 (카메라가 뜨기 전·권한 없음) */
  bgScanner: palette.navy900,
  /** 브랜드 버튼 그라디언트 시작·끝 (Figma Button 채움) */
  bgBrandStart: palette.indigo500,
  bgBrandEnd: palette.indigo700,
  borderDefault: palette.grey200,
  textPrimary: palette.navy900,
  textSecondary: palette.slate500,
  textTertiary: palette.slate400,
  textBrand: palette.indigo600,
  textSuccess: palette.green700,
  textOnBrand: palette.white,
  textOnNavy: palette.white,
  textOnNavyMuted: palette.indigo200,
  /** 브랜드 연한 배경 위 본문 (안내 상자) */
  textBrandStrong: palette.indigo800,
  iconStrong: palette.navy900,
  textDanger: palette.red600,
} as const;

export type ColorTokens = { readonly [K in keyof typeof lightColors]: string };
export type ColorToken = keyof ColorTokens;

/** 다크 시안이 아직 없어 라이트와 같은 값을 쓴다. 시안이 나오면 여기 값만 바꾼다. */
export const darkColors: ColorTokens = lightColors;
