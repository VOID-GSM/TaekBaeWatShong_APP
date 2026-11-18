/**
 * 화면용 택배 모델. API 연동 전이라 서버 스키마(@taekbae/types)가 아직 없다.
 * 시간·남은 시간은 서버 값을 포맷한 문자열로 받는다고 가정한다.
 */
export type ParcelStatus = 'inTransit' | 'arrived' | 'overdue' | 'claimed';

/** 배송 단계. 순서대로 진행된다. */
export const DELIVERY_STEPS = ['집화', '간선상차', '배송중', '도착'] as const;

export interface Parcel {
  id: string;
  name: string;
  carrier: string;
  trackingNumber: string;
  status: ParcelStatus;
  /** 등록 시각(ISO). 최신순 정렬 기준. */
  createdAt: string;
  /** 보관 구역 문자 (A~F). 도착 전이면 없다. */
  zone?: string;
  /** 예: '07.06 16:40' */
  arrivedAt?: string;
  /** 수령 기한까지 남은 시간(방치면 초과 시간). 예: '1일 03:24:17' */
  timeLabel?: string;
  /** 배송중일 때 현재 단계 인덱스 (DELIVERY_STEPS 기준) */
  stepIndex?: number;
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

/** 필터에 맞는 택배를 등록일 최신순으로 돌려준다. */
export function filterParcels(parcels: readonly Parcel[], filter: ParcelFilter): Parcel[] {
  const matched =
    filter === 'latest'
      ? parcels
      : parcels.filter((parcel) => filterStatuses[filter].includes(parcel.status));

  return [...matched].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export interface ParcelSummary {
  total: number;
  arrived: number;
  overdue: number;
}

/** 방치 순위(TOP3) 항목 */
export interface OverdueRank {
  rank: number;
  ownerName: string;
  parcelName: string;
  zone: string;
  /** 예: '3일 07:12' */
  overdueFor: string;
}
