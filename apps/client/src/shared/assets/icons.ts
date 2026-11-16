/**
 * Figma 아이콘·스텝 점 SVG 원본. SVG 파일 import 용 transformer 가 없어 문자열로 두고
 * `SvgXml` 로 렌더한다(`shared/ui/icon`). 색은 시안에 칠해진 그대로다.
 */
export const icons = {
  bell: {
    width: 20,
    height: 20,
    xml: `<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="icon/bell">
<path id="Vector" d="M8.58333 17.5C8.72282 17.7537 8.92787 17.9653 9.17708 18.1127C9.42628 18.26 9.71048 18.3378 10 18.3378C10.2895 18.3378 10.5737 18.26 10.8229 18.1127C11.0721 17.9653 11.2772 17.7537 11.4167 17.5M5 6.66667C5 5.34058 5.52678 4.06881 6.46447 3.13113C7.40215 2.19345 8.67392 1.66667 10 1.66667C11.3261 1.66667 12.5979 2.19345 13.5355 3.13113C14.4732 4.06881 15 5.34058 15 6.66667C15 12.5 17.5 14.1667 17.5 14.1667H2.5C2.5 14.1667 5 12.5 5 6.66667Z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke="#1A1F4B"/>
</g>
</svg>`,
  },
  bellBadge: {
    width: 56,
    height: 30,
    xml: `<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="56" height="30" viewBox="0 0 56 30" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="Pill">
<g id="icon/bell">
<path id="Vector" d="M26.4417 23.25C26.5951 23.5291 26.8207 23.7618 27.0948 23.9239C27.3689 24.086 27.6815 24.1716 28 24.1716C28.3185 24.1716 28.6311 24.086 28.9052 23.9239C29.1793 23.7618 29.4049 23.5291 29.5583 23.25M22.5 11.3333C22.5 9.87464 23.0795 8.4757 24.1109 7.44425C25.1424 6.4128 26.5413 5.83333 28 5.83333C29.4587 5.83333 30.8576 6.4128 31.8891 7.44425C32.9205 8.4757 33.5 9.87464 33.5 11.3333C33.5 17.75 36.25 19.5833 36.25 19.5833H19.75C19.75 19.5833 22.5 17.75 22.5 11.3333Z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke="#9AA1BF"/>
</g>
<circle id="Dot" cx="37.5" cy="6.5" r="3.5" fill="#DC2626" stroke-width="2" stroke="white"/>
</g>
</svg>`,
  },
  home: {
    width: 22,
    height: 22,
    xml: `<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="icon/home">
<path id="Vector" d="M2.75 9.625L11 2.75L19.25 9.625V18.3333C19.25 18.5764 19.1534 18.8096 18.9815 18.9815C18.8096 19.1534 18.5764 19.25 18.3333 19.25H13.75V13.75H8.25V19.25H3.66667C3.42355 19.25 3.19039 19.1534 3.01849 18.9815C2.84658 18.8096 2.75 18.5764 2.75 18.3333V9.625Z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke="white"/>
</g>
</svg>`,
  },
  packagePlus: {
    width: 22,
    height: 22,
    xml: `<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="icon/package-plus">
<path id="Vector" d="M14.6667 14.6667H17.4167M17.4167 14.6667H20.1667M17.4167 14.6667V11.9167M17.4167 14.6667V17.4167" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke="#9AA1BF"/>
<path id="Vector_2" d="M19.25 9.16667V7.33333C19.2497 7.01184 19.1648 6.69608 19.0039 6.41773C18.843 6.13939 18.6118 5.90825 18.3333 5.7475L11.9167 2.08083C11.638 1.91992 11.3218 1.83521 11 1.83521C10.6782 1.83521 10.362 1.91992 10.0833 2.08083L3.66667 5.7475C3.38824 5.90825 3.15698 6.13939 2.99609 6.41773C2.8352 6.69608 2.75033 7.01184 2.75 7.33333V14.6667C2.75033 14.9882 2.8352 15.3039 2.99609 15.5823C3.15698 15.8606 3.38824 16.0918 3.66667 16.2525L10.0833 19.9192C10.362 20.0801 10.6782 20.1648 11 20.1648C11.3218 20.1648 11.638 20.0801 11.9167 19.9192L13.75 18.8742" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke="#9AA1BF"/>
<path id="Vector_3" d="M3.025 6.41667L11 11M11 11L18.975 6.41667M11 11V20.1667" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke="#9AA1BF"/>
</g>
</svg>`,
  },
  scanBarcode: {
    width: 22,
    height: 22,
    xml: `<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="icon/scan-barcode">
<path id="Vector" d="M2.75 6.41667V4.58333C2.75 4.0971 2.94315 3.63079 3.28697 3.28697C3.63079 2.94315 4.0971 2.75 4.58333 2.75H6.41667M15.5833 2.75H17.4167C17.9029 2.75 18.3692 2.94315 18.713 3.28697C19.0568 3.63079 19.25 4.0971 19.25 4.58333V6.41667M19.25 15.5833V17.4167C19.25 17.9029 19.0568 18.3692 18.713 18.713C18.3692 19.0568 17.9029 19.25 17.4167 19.25H15.5833M6.41667 19.25H4.58333C4.0971 19.25 3.63079 19.0568 3.28697 18.713C2.94315 18.3692 2.75 17.9029 2.75 17.4167V15.5833M7.33333 6.41667V15.5833M11 6.41667V15.5833M14.6667 6.41667V15.5833" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke="#9AA1BF"/>
</g>
</svg>`,
  },
  chat: {
    width: 22,
    height: 22,
    xml: `<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="icon/chat">
<path id="Vector" d="M7.24167 18.3333C8.9912 19.2308 11.0037 19.4739 12.9166 19.0188C14.8295 18.5637 16.517 17.4403 17.6749 15.8512C18.8329 14.262 19.3851 12.3115 19.2322 10.3511C19.0793 8.39081 18.2312 6.54956 16.8408 5.15918C15.4504 3.7688 13.6092 2.92073 11.6489 2.7678C9.68852 2.61487 7.73802 3.16713 6.14884 4.32506C4.55965 5.48299 3.4363 7.17045 2.9812 9.08335C2.52611 10.9963 2.7692 13.0088 3.66667 14.7583L1.83333 20.1667L7.24167 18.3333Z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke="#9AA1BF"/>
</g>
</svg>`,
  },
  info: {
    width: 16,
    height: 16,
    xml: `<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="icon/info">
<path id="Vector" d="M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8Z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke="#4352CF"/>
<path id="Vector_2" d="M8 10.6667V8M8 5.33333H8.00667" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke="#4352CF"/>
</g>
</svg>`,
  },
  infoMuted: {
    width: 14,
    height: 14,
    xml: `<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="icon/info">
<path id="Vector" d="M12.25 7C12.25 9.8995 9.8995 12.25 7 12.25C4.1005 12.25 1.75 9.8995 1.75 7C1.75 4.1005 4.1005 1.75 7 1.75C9.8995 1.75 12.25 4.1005 12.25 7Z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke="#9AA1BF"/>
<path id="Vector_2" d="M7 9.33333V7M7 4.66667H7.00583" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke="#9AA1BF"/>
</g>
</svg>`,
  },
  map: {
    width: 20,
    height: 20,
    xml: `<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="icon/map">
<path id="Vector" d="M12.5 5L7.5 2.5L2.5 5V17.5L7.5 15M7.5 2.5V15M7.5 15L12.5 17.5L17.5 15V2.5L12.5 5M12.5 5V17.5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke="#4352CF"/>
</g>
</svg>`,
  },
  alert: {
    width: 20,
    height: 20,
    xml: `<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="icon/alert">
<path id="Vector" d="M10 7.5V10.8333M10 14.1667H10.0083M18.1083 15L11.4417 3.33333C11.2963 3.07684 11.0855 2.86349 10.8308 2.71506C10.576 2.56662 10.2865 2.48842 9.99167 2.48842C9.69684 2.48842 9.4073 2.56662 9.15256 2.71506C8.89783 2.86349 8.68703 3.07684 8.54167 3.33333L1.875 15C1.72807 15.2545 1.65102 15.5433 1.65167 15.8371C1.65232 16.1309 1.73065 16.4194 1.87871 16.6732C2.02676 16.927 2.23929 17.1372 2.49475 17.2824C2.7502 17.4276 3.03951 17.5026 3.33333 17.5H16.6667C16.9591 17.4997 17.2463 17.4225 17.4994 17.2761C17.7525 17.1297 17.9627 16.9192 18.1088 16.6659C18.2548 16.4126 18.3317 16.1253 18.3316 15.8329C18.3315 15.5405 18.2545 15.2532 18.1083 15Z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke="#DC2626"/>
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
  // 아래 두 아이콘은 시안에 없어 선택 메뉴용으로 직접 그렸다.
  chevronDown: {
    width: 16,
    height: 16,
    xml: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M4 6L8 10L12 6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke="#9AA1BF"/>
</svg>`,
  },
  check: {
    width: 16,
    height: 16,
    xml: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M3.33333 8.33333L6.33333 11.3333L12.6667 5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke="#4352CF"/>
</svg>`,
  },
} as const;

export type IconName = keyof typeof icons;
