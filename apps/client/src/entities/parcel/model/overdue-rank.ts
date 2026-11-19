import type { UnclaimedRank } from '@taekbae/types';
import { localDateTimeToDate } from '@taekbae/utils';

import type { OverdueRank } from './parcel';

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** 도착 후 지난 시간을 `3일 07:12` 형식으로. 음수(기기 시계가 서버보다 느린 경우)는 0 으로 본다. */
export function formatOverdueFor(ms: number): string {
  const total = Math.max(0, ms);
  const days = Math.floor(total / DAY_MS);
  const hours = Math.floor((total % DAY_MS) / HOUR_MS);
  const minutes = Math.floor((total % HOUR_MS) / MINUTE_MS);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${days}일 ${pad(hours)}:${pad(minutes)}`;
}

/**
 * 서버 방치 순위를 화면 모델로 바꾼다. 포함 여부·순위는 서버(도착 후 24시간, 오래된 순 TOP3)를 그대로 따르고,
 * 앱은 표시용 경과 시간만 계산한다. 기기 시계나 시간대가 서버와 어긋나도 항목이 빠지지 않게 하기 위함이다.
 */
export function toOverdueRanks(ranks: readonly UnclaimedRank[], now: Date): OverdueRank[] {
  return ranks.map((item) => {
    const arrivedAt = localDateTimeToDate(item.arrivedAt);
    const elapsed = arrivedAt ? now.getTime() - arrivedAt.getTime() : 0;
    return {
      rank: item.rank,
      ownerName: item.ownerName,
      zone: item.zone ?? null,
      overdueFor: formatOverdueFor(elapsed),
    };
  });
}
