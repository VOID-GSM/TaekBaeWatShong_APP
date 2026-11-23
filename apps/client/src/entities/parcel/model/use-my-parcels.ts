import { type ApiError, parcelQueries } from '@taekbae/api';
import type { Parcel as ServerParcel } from '@taekbae/types';
import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useNow } from '@/shared/hooks';

import type { Parcel, ParcelSummary } from './parcel';
import { summarizeParcels, toParcelCards } from './parcel-card';

/** 도착 후 경과 시간이 분 단위라 1분마다 다시 계산한다. */
const NOW_INTERVAL_MS = 60_000;

export interface UseMyParcelsResult {
  /** 아직 데이터가 없으면 undefined (요청 중이거나 첫 요청이 실패한 상태). */
  parcels: Parcel[] | undefined;
  summary: ParcelSummary | undefined;
  isPending: boolean;
  isRefetching: boolean;
  error: ApiError | null;
  refetch: () => void;
}

/** 홈 '내 택배' — `GET /parcel/me` 전체 목록을 카드 모델과 요약으로 바꿔 돌려준다. */
export function useMyParcels(): UseMyParcelsResult {
  const now = useNow(NOW_INTERVAL_MS);
  const select = useCallback((parcels: ServerParcel[]) => toParcelCards(parcels, now), [now]);
  const query = useQuery({ ...parcelQueries.mine(), select });

  return {
    parcels: query.data,
    summary: query.data ? summarizeParcels(query.data) : undefined,
    isPending: query.isPending,
    isRefetching: query.isRefetching,
    // @taekbae/api 의 요청 함수는 실패를 모두 ApiError 로 정규화한다.
    error: query.error as ApiError | null,
    refetch: () => void query.refetch(),
  };
}
