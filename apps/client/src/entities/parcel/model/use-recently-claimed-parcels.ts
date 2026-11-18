import { type ApiError, parcelQueries } from '@taekbae/api';
import type { Parcel } from '@taekbae/types';
import { localDateTimeToDate } from '@taekbae/utils';
import { useQuery } from '@tanstack/react-query';

export interface ClaimedParcel {
  parcel: Parcel;
  claimedAt: Date;
  arrivedAt: Date | null;
}

export interface UseRecentlyClaimedParcelsResult {
  parcels: ClaimedParcel[];
  isPending: boolean;
  error: ApiError | null;
  refetch: () => void;
}

/** 오늘(기기 날짜 기준) 회수한 내 택배를 최근 회수 순으로 돌려준다. */
export function selectRecentlyClaimed(parcels: readonly Parcel[], now: Date): ClaimedParcel[] {
  const today = now.toDateString();
  return parcels
    .flatMap((parcel) => {
      const claimedAt = parcel.claimedAt ? localDateTimeToDate(parcel.claimedAt) : null;
      if (!claimedAt || claimedAt.toDateString() !== today) return [];
      const arrivedAt = parcel.arrivedAt ? localDateTimeToDate(parcel.arrivedAt) : null;
      return [{ parcel, claimedAt, arrivedAt }];
    })
    .sort((a, b) => b.claimedAt.getTime() - a.claimedAt.getTime());
}

/** 회수 화면의 '방금 회수한 택배'. 회수 요청이 성공하면 parcel 쿼리가 무효화되어 다시 불러온다. */
export function useRecentlyClaimedParcels(): UseRecentlyClaimedParcelsResult {
  const query = useQuery({
    ...parcelQueries.mine({ status: 'CLAIMED' }),
    select: (parcels) => selectRecentlyClaimed(parcels, new Date()),
  });

  return {
    parcels: query.data ?? [],
    isPending: query.isPending,
    error: query.error as ApiError | null,
    refetch: () => void query.refetch(),
  };
}
