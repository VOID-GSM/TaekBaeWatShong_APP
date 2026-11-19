import type { NotificationType } from '@taekbae/types';
import { localDateTimeToDate } from '@taekbae/utils';

/** 화면이 아이콘·색을 고르는 알림 종류. 서버가 새 종류를 보내면 `unknown` 으로 기본 모양을 쓴다. */
export type NotificationKind =
  'registered' | 'arrived' | 'zoneAssigned' | 'claimed' | 'unclaimedReminder' | 'unknown';

// Map 으로 둔다 — 객체 조회는 'toString' 같은 문자열에 프로토타입 값을 돌려준다.
const kindByType: ReadonlyMap<string, NotificationKind> = new Map<
  NotificationType,
  NotificationKind
>([
  ['REGISTERED', 'registered'],
  ['ARRIVED', 'arrived'],
  ['ZONE_ASSIGNED', 'zoneAssigned'],
  ['CLAIMED', 'claimed'],
  ['UNCLAIMED_REMINDER', 'unclaimedReminder'],
]);

/** 스키마가 `type` 을 문자열로 받으므로(목록 한 건 때문에 전체가 실패하지 않게) 여기서 종류를 가린다. */
export function getNotificationKind(type: string): NotificationKind {
  return kindByType.get(type) ?? 'unknown';
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

/**
 * 알림 목록의 시각 표시. `createdAt` 은 오프셋 없는 서버 `LocalDateTime` 이라 기기 로컬 시각으로 본다.
 * 1분 전까지 '방금 전', 1시간 전까지 'N분 전', 오늘이면 'N시간 전', 어제면 '어제', 올해면 'M월 D일', 그 전이면 'YYYY. M. D.'.
 * 해석할 수 없는 값은 원문 그대로 돌려준다. `now` 는 테스트에서 기준 시각을 고정하려고 받는다.
 */
export function formatNotificationTime(createdAt: string, now: Date = new Date()): string {
  const date = localDateTimeToDate(createdAt);
  if (!date || Number.isNaN(date.getTime())) return createdAt;

  // 서버와 기기 시계가 조금 어긋나 미래 시각이 와도 '방금 전'으로 본다.
  const elapsed = now.getTime() - date.getTime();
  if (elapsed < MINUTE) return '방금 전';
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}분 전`;

  const today = startOfDay(now);
  if (date >= today) return `${Math.floor(elapsed / HOUR)}시간 전`;

  // 하루를 24시간으로 빼지 않고 날짜로 계산한다 — 서머타임이 있는 지역에서도 어제가 어긋나지 않게.
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  if (date >= yesterday) return '어제';

  if (date.getFullYear() === now.getFullYear())
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}.`;
}
