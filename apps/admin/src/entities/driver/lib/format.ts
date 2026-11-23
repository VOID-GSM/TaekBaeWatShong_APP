const HONORIFIC = /\s*기사님\s*$/;

/** 입력값 끝의 `기사님` 을 뗀 이름. 시안 예시처럼 `김택배 기사님` 으로 입력해도 서버에는 `김택배` 만 저장한다. */
export function normalizeDriverName(value: string): string {
  return value.trim().replace(HONORIFIC, '').trim();
}

/** `김택배 기사님` */
export function formatDriverName(driverName: string): string {
  return `${normalizeDriverName(driverName)} 기사님`;
}
