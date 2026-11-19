import { type ApiError, parcelQueries } from '@taekbae/api';
import type { UnclaimedRank } from '@taekbae/types';
import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useNow } from '@/shared/hooks';

import { toOverdueRanks } from './overdue-rank';
import type { OverdueRank } from './parcel';

/** 방치 시간 표시는 분 단위라 1분마다 갱신한다. */
const NOW_INTERVAL_MS = 60_000;

export interface UseOverdueRankingResult {
  ranks: OverdueRank[] | undefined;
  isPending: boolean;
  error: ApiError | null;
  refetch: () => void;
}

/** 도착 후 24시간 넘게 찾아가지 않은 택배 TOP3. 방치 시간은 1분마다 다시 계산한다. */
export function useOverdueRanking(): UseOverdueRankingResult {
  const now = useNow(NOW_INTERVAL_MS);
  const select = useCallback((ranks: UnclaimedRank[]) => toOverdueRanks(ranks, now), [now]);
  const query = useQuery({ ...parcelQueries.unclaimedRanking(), select });

  return {
    ranks: query.data,
    isPending: query.isPending,
    // @taekbae/api 의 요청 함수는 실패를 모두 ApiError 로 정규화한다.
    error: query.error as ApiError | null,
    refetch: () => void query.refetch(),
  };
}
