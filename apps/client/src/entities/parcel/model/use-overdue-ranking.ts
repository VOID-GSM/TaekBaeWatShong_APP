import { type ApiError, parcelQueries } from '@taekbae/api';
import { useQuery } from '@tanstack/react-query';

import { toOverdueRanks } from './overdue-rank';
import type { OverdueRank } from './parcel';

export interface UseOverdueRankingResult {
  ranks: OverdueRank[] | undefined;
  isPending: boolean;
  error: ApiError | null;
  refetch: () => void;
}

/** 도착 후 24시간 넘게 찾아가지 않은 택배 TOP3. 방치 시간은 조회 시점 기준이다. */
export function useOverdueRanking(): UseOverdueRankingResult {
  const query = useQuery({
    ...parcelQueries.unclaimedRanking(),
    select: (ranks) => toOverdueRanks(ranks, new Date()),
  });

  return {
    ranks: query.data,
    isPending: query.isPending,
    // @taekbae/api 의 요청 함수는 실패를 모두 ApiError 로 정규화한다.
    error: query.error as ApiError | null,
    refetch: () => void query.refetch(),
  };
}
