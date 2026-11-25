const pad = (value: number) => String(value).padStart(2, '0');

/** 채팅 목록 시각: `방금 전` · `N분 전` · `N시간 전`(오늘) · `어제` · `MM.DD`. 기기 시각 기준. */
export function formatRelativeTime(date: Date, now: Date = new Date()): string {
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60_000);

  // 기기 시계가 서버보다 느려 미래 시각이 오는 경우도 방금 전으로 본다.
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

  if (date >= startOfToday) return `${Math.floor(minutes / 60)}시간 전`;
  if (date >= startOfYesterday) return '어제';
  return `${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
}
