import type { ViewStyle } from 'react-native';

/**
 * 간격. xs~2xl 은 Figma 변수(space/*).
 * mdPlus·3xl·4xl 은 시안에 변수 없이 쓰인 수치를 토큰으로 올린 것 — 디자이너 확인 필요.
 * (Figma 의 space/3xl 은 32 라 여기 3xl(28)과 다르다.)
 */
export const spacing = {
  '2xs': 2,
  xs: 4,
  xsPlus: 6,
  sm: 8,
  md: 12,
  mdPlus: 14,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 40,
} as const;

/** Figma 변수(radius/*). */
export const radius = {
  sm: 10,
  /** 입력 카드(분실 신고 C9)도 이 값을 쓴다. */
  md: 16,
  lg: 22,
  xl: 26,
  '2xl': 32,
  /** 하단 탭 바 위쪽 모서리. Figma 에 변수 없이 쓰인 값. */
  sheet: 20,
  full: 999,
  logoMark: 40,
} as const;

export const size = {
  buttonL: 56,
  buttonM: 40,
  /** 입력칸 높이 */
  field: 52,
  /** 안내 문구·링크 옆 작은 아이콘 */
  iconS: 14,
  /** 버튼 안 아이콘 */
  iconM: 22,
  iconButton: 40,
  topBar: 56,
  /** 하단 탭 바 항목의 알약 모양 배경 */
  tabPillWidth: 56,
  tabPillHeight: 30,
  logoMark: 130,
  logoRing: 160,
  /** 화면 상단 헤더(뒤로가기 + 제목) 높이. C9 스크린샷 추정 — 디자이너 확인 필요. */
  header: 56,
  /** 최소 터치 영역 */
  touchTarget: 44,
  /** 한 줄 입력 카드 높이. C9 스크린샷 추정(약 49) — 디자이너 확인 필요. */
  inputM: 48,
  /** 여러 줄 입력 카드 최소 높이. C9 스크린샷 추정(약 133) — 디자이너 확인 필요. */
  inputMultiline: 132,
  /** 하단 고정 버튼(취소·제출) 높이. C9 스크린샷 추정(약 49) — 디자이너 확인 필요. */
  buttonFooter: 50,
} as const;

export const opacity = { pressed: 0.85, disabled: 0.6 } as const;

/** 테두리 두께 */
export const borderWidth = { thin: 1 } as const;

export const motion = { fast: 150, normal: 250, slow: 400 } as const;

/**
 * Figma 효과 스타일. 레이어가 둘이고 spread 가 있어 iOS shadow* / elevation 으로는
 * 표현이 안 되므로 `boxShadow`(New Architecture, Android 9+)를 쓴다.
 */
export const shadow = {
  card: {
    boxShadow: [
      { offsetX: 0, offsetY: 1, blurRadius: 3, spreadDistance: 0, color: 'rgba(15, 23, 41, 0.05)' },
      {
        offsetX: 0,
        offsetY: 6,
        blurRadius: 16,
        spreadDistance: -4,
        color: 'rgba(15, 23, 41, 0.04)',
      },
    ],
  },
  /**
   * 연한 브랜드 면(bgBrandSoft)을 배경에서 띄워 보이게 하는 브랜드 톤 그림자.
   * 시안에 없어 임의로 정했다 — 디자이너 확인 필요.
   */
  brandRaised: {
    boxShadow: [
      {
        offsetX: 0,
        offsetY: 2,
        blurRadius: 6,
        spreadDistance: 0,
        color: 'rgba(67, 82, 207, 0.08)',
      },
      {
        offsetX: 0,
        offsetY: 10,
        blurRadius: 24,
        spreadDistance: -6,
        color: 'rgba(67, 82, 207, 0.22)',
      },
    ],
  },
  /** Figma `Shadow/Float-Up` — 하단 탭 바처럼 화면 아래에 붙은 면 */
  floatUp: {
    boxShadow: [
      {
        offsetX: 0,
        offsetY: -4,
        blurRadius: 20,
        spreadDistance: 0,
        color: 'rgba(15, 23, 41, 0.08)',
      },
    ],
  },
  logo: {
    boxShadow: [
      {
        offsetX: 0,
        offsetY: 7.5,
        blurRadius: 20,
        spreadDistance: -2.5,
        color: 'rgba(37, 99, 235, 0.3)',
      },
    ],
  },
} satisfies Record<string, ViewStyle>;
