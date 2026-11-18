import { type ApiError, parcelQueries } from '@taekbae/api';
import { useQuery } from '@tanstack/react-query';

import { toZoneShelves, type ZoneShelves } from './zone';

export interface UseZoneShelvesResult {
  shelves: ZoneShelves | undefined;
  isPending: boolean;
  error: ApiError | null;
  refetch: () => void;
}

/** 구역별 보관 수를 약도 선반 배치로 조회한다. */
export function useZoneShelves(): UseZoneShelvesResult {
  const query = useQuery({ ...parcelQueries.zoneSummary(), select: toZoneShelves });

  return {
    shelves: query.data,
    isPending: query.isPending,
    // @taekbae/api 의 요청 함수는 실패를 모두 ApiError 로 정규화한다.
    error: query.error as ApiError | null,
    refetch: () => void query.refetch(),
  };
}
