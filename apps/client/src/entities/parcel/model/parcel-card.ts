import type { Parcel as ServerParcel } from '@taekbae/types';
import { formatMonthDayTime, localDateTimeToDate } from '@taekbae/utils';

import { formatOverdueFor } from './overdue-rank';
import type { Parcel, ParcelStatus, ParcelSummary } from './parcel';

const DAY_MS = 24 * 60 * 60 * 1000;

const toDate = (value: string | null | undefined) => (value ? localDateTimeToDate(value) : null);

/**
 * 방치 여부. 서버가 `unclaimedDays` 를 주면 그대로 따르고(기기 시계가 어긋나도 서버와 같게),
 * 없을 때만 도착 후 24시간이 지났는지 앱에서 본다 — 방치 순위(`GET /parcel/unclaimed/ranking`)와 같은 기준.
 */
function isOverdue(parcel: ServerParcel, arrivedAt: Date | null, now: Date): boolean {
  if (parcel.unclaimedDays != null) return parcel.unclaimedDays >= 1;
  return arrivedAt !== null && now.getTime() - arrivedAt.getTime() >= DAY_MS;
}

function toStatus(parcel: ServerParcel, arrivedAt: Date | null, now: Date): ParcelStatus | null {
  switch (parcel.status) {
    case 'PENDING':
      return 'inTransit';
    case 'ARRIVED':
      return isOverdue(parcel, arrivedAt, now) ? 'overdue' : 'arrived';
    case 'CLAIMED':
      return 'claimed';
    default:
      return null;
  }
}

/** 서버 택배 목록을 카드용 모델로 바꾼다. 앱이 모르는 상태의 택배는 잘못 표시하지 않도록 뺀다. */
export function toParcelCards(parcels: readonly ServerParcel[], now: Date): Parcel[] {
  return parcels.flatMap((parcel) => {
    const arrivedAt = toDate(parcel.arrivedAt);
    const claimedAt = toDate(parcel.claimedAt);
    const status = toStatus(parcel, arrivedAt, now);
    if (status === null) return [];

    return [
      {
        id: parcel.id,
        name: parcel.alias,
        carrier: parcel.deliveryCompany,
        trackingNumber: parcel.invoiceNumber,
        status,
        createdAt: toDate(parcel.createdAt),
        zone: parcel.zone ?? undefined,
        arrivedAt: arrivedAt ? formatMonthDayTime(arrivedAt) : undefined,
        timeLabel: arrivedAt ? formatOverdueFor(now.getTime() - arrivedAt.getTime()) : undefined,
        claimedAt: claimedAt ? formatMonthDayTime(claimedAt) : undefined,
      },
    ];
  });
}

/** 홈 상단 요약 — 전체·보관 중(방치 포함)·방치 개수. */
export function summarizeParcels(parcels: readonly Parcel[]): ParcelSummary {
  return {
    total: parcels.length,
    arrived: parcels.filter((p) => p.status === 'arrived' || p.status === 'overdue').length,
    overdue: parcels.filter((p) => p.status === 'overdue').length,
  };
}
