/**
 * 화면용 택배 모델. API 연동 전이라 서버 스키마(@taekbae/types)가 아직 없다.
 * 시간·남은 시간은 서버 값을 포맷한 문자열로 받는다고 가정한다.
 */
export type ParcelStatus = 'inTransit' | 'arrived' | 'overdue';

/** 배송 단계. 순서대로 진행된다. */
export const DELIVERY_STEPS = ['집화', '간선상차', '배송중', '도착'] as const;

export interface Parcel {
  id: string;
  name: string;
  carrier: string;
  trackingNumber: string;
  status: ParcelStatus;
  /** 보관 구역 문자 (A~F). 도착 전이면 없다. */
  zone?: string;
  /** 예: '07.06 16:40' */
  arrivedAt?: string;
  /** 수령 기한까지 남은 시간(방치면 초과 시간). 예: '1일 03:24:17' */
  timeLabel?: string;
  /** 배송중일 때 현재 단계 인덱스 (DELIVERY_STEPS 기준) */
  stepIndex?: number;
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
