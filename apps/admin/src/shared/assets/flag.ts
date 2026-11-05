/**
 * 신고 아이콘 (Figma `icon/flag`, 22×22). 탭 바 신고 알약 안의 깃발 경로를 그대로 쓰고
 * viewBox 를 깃발 위치(17, 4)에 맞춰 22×22 로 잘랐다. 새 신고 점은 탭 버튼이 따로 그린다.
 * 선 색은 `currentColor` 라 `SvgXml` 의 `color` 로 토큰 색을 넣는다.
 */
export const flagXml = `<svg width="22" height="22" viewBox="17 4 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M20.6667 17.75C20.6667 17.75 21.5833 16.8333 24.3333 16.8333C27.0833 16.8333 28.9167 18.6667 31.6667 18.6667C34.4167 18.6667 35.3333 17.75 35.3333 17.75V6.75C35.3333 6.75 34.4167 7.66667 31.6667 7.66667C28.9167 7.66667 27.0833 5.83333 24.3333 5.83333C21.5833 5.83333 20.6667 6.75 20.6667 6.75V17.75ZM20.6667 17.75V24.1667" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/>
</svg>`;
