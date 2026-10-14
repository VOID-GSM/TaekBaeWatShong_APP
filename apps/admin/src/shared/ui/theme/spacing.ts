import type { ViewStyle } from 'react-native';

/**
 * 간격. xs~2xl 은 Figma 변수(space/*).
 * mdPlus·3xl·4xl 은 시안에 변수 없이 쓰인 수치를 토큰으로 올린 것 — 디자이너 확인 필요.
 */
export const spacing = {
  xs: 4,
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
export const radius = { md: 16, lg: 22, full: 999 } as const;

/** 컴포넌트 고정 크기. */
export const size = {
  /** Button/L 높이 */
  buttonL: 56,
  /** 브랜드 버튼 높이 */
  buttonM: 52,
  /** 입력 필드 높이 */
  field: 52,
  /** TopBar 높이 */
  topBar: 56,
  /** TopBar 아이콘 버튼 터치 영역 */
  iconButton: 40,
  /** TopBar 아이콘 */
  iconL: 24,
  /** 버튼 안 아이콘 */
  iconM: 22,
  /** 로고 마크 본체 */
  logoMark: 130,
  /** 로고 마크를 감싸는 Ring */
  logoRing: 160,
  /** Ring 을 감싸는 Halo */
  logoHalo: 220,
} as const;

export const opacity = { pressed: 0.85, disabled: 0.6 } as const;

export const motion = { fast: 150, normal: 250, slow: 400 } as const;

/**
 * Figma 효과 스타일. 레이어가 둘이고 spread 가 있어 iOS shadow* / elevation 으로는
 * 표현이 안 되므로 `boxShadow`(New Architecture, Android 9+)를 쓴다.
 */
export const shadow = {
  /** Shadow/Card */
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
} satisfies Record<string, ViewStyle>;
