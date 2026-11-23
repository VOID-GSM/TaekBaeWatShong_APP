/**
 * 화면용 택배 모델. 서버 `Parcel`(@taekbae/types)을 `toParcelCards` 로 바꿔 만든다.
 * 서버 상태는 PENDING·ARRIVED·CLAIMED 세 가지이고, 방치(overdue)는 ARRIVED 중 도착 후 하루가 지난 택배다.
 */
export type ParcelStatus = 'inTransit' | 'arrived' | 'overdue' | 'claimed';

/** 배송 단계. 순서대로 진행된다. 서버가 아직 배송 단계를 주지 않아 홈 카드에는 표시하지 않는다. */
export const DELIVERY_STEPS = ['집화', '간선상차', '배송중', '도착'] as const;

export interface Parcel {
  id: number;
  /** 사용자가 등록한 별칭 */
  name: string;
  carrier: string;
  trackingNumber: string;
  status: ParcelStatus;
  /** 등록 시각. 최신순 정렬 기준. 서버가 주지 않으면 null. */
  createdAt: Date | null;
  /** 보관 구역 문자 (A~F). 도착 전이거나 미배정이면 없다. */
  zone?: string;
  /** 예: '07.06 16:40' */
  arrivedAt?: string;
  /** 도착 후 지난 시간. 예: '1일 03:24' */
  timeLabel?: string;
  /** 수령 완료 시각. 예: '07.06 12:00' */
  claimedAt?: string;
}

/** 홈 '내 택배' 목록 필터. 최신순은 전체, 나머지는 카드 상태 배지와 같은 이름이다. */
export type ParcelFilter = 'latest' | 'claimed' | 'arrived' | 'pending';

export const PARCEL_FILTERS: readonly { value: ParcelFilter; label: string }[] = [
  { value: 'latest', label: '최신순' },
  { value: 'claimed', label: '수령 완료' },
  { value: 'arrived', label: '도착' },
  { value: 'pending', label: '배송중' },
];

/** 필터별로 보여줄 상태. 도착은 방치 경고 택배도 포함한다. */
const filterStatuses: Record<Exclude<ParcelFilter, 'latest'>, readonly ParcelStatus[]> = {
  claimed: ['claimed'],
  arrived: ['arrived', 'overdue'],
  pending: ['inTransit'],
};

/** 필터에 맞는 택배를 등록일 최신순으로 돌려준다. 등록일이 없으면 id 가 큰(나중에 등록된) 순. */
export function filterParcels(parcels: readonly Parcel[], filter: ParcelFilter): Parcel[] {
  const matched =
    filter === 'latest'
      ? parcels
      : parcels.filter((parcel) => filterStatuses[filter].includes(parcel.status));

  return [...matched].sort(
    (a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0) || b.id - a.id,
  );
}

export interface ParcelSummary {
  total: number;
  /** 보관 중(방치 포함) */
  arrived: number;
  overdue: number;
}

/** 방치 순위(TOP3) 항목 */
export interface OverdueRank {
  rank: number;
  ownerName: string;
  /** 보관 구역 문자. 구역 미배정이면 null. */
  zone: string | null;
  /** 예: '3일 07:12' */
  overdueFor: string;
}
