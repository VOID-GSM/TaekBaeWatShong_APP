import type { UnclaimedRank } from '@taekbae/types';
import { localDateTimeToDate } from '@taekbae/utils';

import type { OverdueRank } from './parcel';

/** 도착 후 이 시간이 지나도 찾아가지 않으면 방치자로 본다. */
export const OVERDUE_AFTER_MS = 24 * 60 * 60 * 1000;

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** 도착 후 지난 시간을 `3일 07:12` 형식으로. */
export function formatElapsed(ms: number): string {
  const days = Math.floor(ms / DAY_MS);
  const hours = Math.floor((ms % DAY_MS) / HOUR_MS);
  const minutes = Math.floor((ms % HOUR_MS) / MINUTE_MS);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${days}일 ${pad(hours)}:${pad(minutes)}`;
}

/**
 * 서버 방치 순위를 화면 모델로 바꾼다. 서버가 24시간 기준으로 거르지만, 기기 시각 기준으로도 24시간이 안 된
 * 항목이나 도착 시각을 읽을 수 없는 항목은 빼고 오래된 순으로 다시 순위를 매긴다.
 */
export function toOverdueRanks(ranks: readonly UnclaimedRank[], now: Date): OverdueRank[] {
  return ranks
    .map((item) => ({ item, arrivedAt: localDateTimeToDate(item.arrivedAt) }))
    .flatMap(({ item, arrivedAt }) => {
      if (!arrivedAt) return [];
      const elapsed = now.getTime() - arrivedAt.getTime();
      return elapsed >= OVERDUE_AFTER_MS ? [{ item, elapsed }] : [];
    })
    .sort((a, b) => b.elapsed - a.elapsed)
    .slice(0, 3)
    .map(({ item, elapsed }, index) => ({
      rank: index + 1,
      ownerName: item.ownerName,
      parcelName: item.alias,
      zone: item.zone ?? '-',
      overdueFor: formatElapsed(elapsed),
    }));
}
