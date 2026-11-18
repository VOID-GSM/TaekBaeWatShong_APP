import type { ColorToken } from '../ui/theme';

interface IconAsset {
  width: number;
  height: number;
  xml: string;
  /** 선 색 기본값. SVG 는 `currentColor` 로 그려 `Icon` 의 color 로 바꿀 수 있다. */
  color?: ColorToken;
}

/**
 * Figma 아이콘·스텝 점 SVG 원본. SVG 파일 import 용 transformer 가 없어 문자열로 두고
 * `SvgXml` 로 렌더한다(`shared/ui/icon`). 스텝 점은 그라데이션·고정 색이라 색을 바꾸지 않는다.
 */
export const icons = {
  bell: {
    color: 'iconStrong',
    width: 20,
    height: 20,
    xml: `<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="icon/bell">
<path id="Vector" d="M8.58333 17.5C8.72282 17.7537 8.92787 17.9653 9.17708 18.1127C9.42628 18.26 9.71048 18.3378 10 18.3378C10.2895 18.3378 10.5737 18.26 10.8229 18.1127C11.0721 17.9653 11.2772 17.7537 11.4167 17.5M5 6.66667C5 5.34058 5.52678 4.06881 6.46447 3.13113C7.40215 2.19345 8.67392 1.66667 10 1.66667C11.3261 1.66667 12.5979 2.19345 13.5355 3.13113C14.4732 4.06881 15 5.34058 15 6.66667C15 12.5 17.5 14.1667 17.5 14.1667H2.5C2.5 14.1667 5 12.5 5 6.66667Z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/>
</g>
</svg>`,
  },
  info: {
    color: 'iconBrand',
    width: 16,
    height: 16,
    xml: `<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="icon/info">
<path id="Vector" d="M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8Z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/>
<path id="Vector_2" d="M8 10.6667V8M8 5.33333H8.00667" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/>
</g>
</svg>`,
  },
  map: {
    color: 'iconBrand',
    width: 20,
    height: 20,
    xml: `<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="icon/map">
<path id="Vector" d="M12.5 5L7.5 2.5L2.5 5V17.5L7.5 15M7.5 2.5V15M7.5 15L12.5 17.5L17.5 15V2.5L12.5 5M12.5 5V17.5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/>
</g>
</svg>`,
  },
  alert: {
    color: 'statusDanger',
    width: 20,
    height: 20,
    xml: `<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="icon/alert">
<path id="Vector" d="M10 7.5V10.8333M10 14.1667H10.0083M18.1083 15L11.4417 3.33333C11.2963 3.07684 11.0855 2.86349 10.8308 2.71506C10.576 2.56662 10.2865 2.48842 9.99167 2.48842C9.69684 2.48842 9.4073 2.56662 9.15256 2.71506C8.89783 2.86349 8.68703 3.07684 8.54167 3.33333L1.875 15C1.72807 15.2545 1.65102 15.5433 1.65167 15.8371C1.65232 16.1309 1.73065 16.4194 1.87871 16.6732C2.02676 16.927 2.23929 17.1372 2.49475 17.2824C2.7502 17.4276 3.03951 17.5026 3.33333 17.5H16.6667C16.9591 17.4997 17.2463 17.4225 17.4994 17.2761C17.7525 17.1297 17.9627 16.9192 18.1088 16.6659C18.2548 16.4126 18.3317 16.1253 18.3316 15.8329C18.3315 15.5405 18.2545 15.2532 18.1083 15Z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/>
</g>
</svg>`,
  },
  stepDotDone: {
    width: 10,
    height: 10,
    xml: `<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle id="Step dot" cx="5" cy="5" r="5" fill="url(#paint0_linear_0_126)"/>
<defs>
<linearGradient id="paint0_linear_0_126" x1="1.17223" y1="1.69823" x2="8.6865" y2="8.31079" gradientUnits="userSpaceOnUse">
<stop stop-color="#4F5ED8"/>
<stop offset="1" stop-color="#3A47BE"/>
</linearGradient>
</defs>
</svg>`,
  },
  stepDotCurrent: {
    width: 22,
    height: 22,
    xml: `<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle id="Step dot" cx="11" cy="11" r="9" fill="url(#paint0_linear_0_125)" stroke-width="4" stroke="#E1E5FF"/>
<defs>
<linearGradient id="paint0_linear_0_125" x1="5.64112" y1="6.37752" x2="16.1611" y2="15.6351" gradientUnits="userSpaceOnUse">
<stop stop-color="#4F5ED8"/>
<stop offset="1" stop-color="#3A47BE"/>
</linearGradient>
</defs>
</svg>`,
  },
  stepDotTodo: {
    width: 10,
    height: 10,
    xml: `<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle id="Step dot" cx="5" cy="5" r="5" fill="#CDD2E6"/>
</svg>`,
  },
  // 아래 아이콘은 시안에 없어 선택 메뉴·링크용으로 직접 그렸다.
  chevronDown: {
    color: 'iconMuted',
    width: 16,
    height: 16,
    xml: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M4 6L8 10L12 6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/>
</svg>`,
  },
  chevronRight: {
    color: 'iconMuted',
    width: 16,
    height: 16,
    xml: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M6 4L10 8L6 12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/>
</svg>`,
  },
  check: {
    color: 'iconBrand',
    width: 16,
    height: 16,
    xml: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M3.33333 8.33333L6.33333 11.3333L12.6667 5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/>
</svg>`,
  },
} as const satisfies Record<string, IconAsset>;

export type IconName = keyof typeof icons;
