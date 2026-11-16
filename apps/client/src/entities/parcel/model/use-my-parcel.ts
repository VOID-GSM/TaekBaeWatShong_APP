import { type ApiError, parcelQueries } from '@taekbae/api';
import type { Parcel } from '@taekbae/types';
import { useQuery } from '@tanstack/react-query';

export interface UseMyParcelResult {
  parcel: Parcel | undefined;
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => void;
}

/** 단건 조회 API가 없어 `GET /parcel/me` 목록에서 운송장 번호로 찾는다. */
export function useMyParcel(invoiceNumber: string): UseMyParcelResult {
  const query = useQuery({
    ...parcelQueries.mine(),
    select: (parcels) => parcels.find((parcel) => parcel.invoiceNumber === invoiceNumber),
  });

  return {
    parcel: query.data,
    isLoading: query.isLoading,
    // @taekbae/api 의 요청 함수는 실패를 모두 ApiError 로 정규화한다.
    error: query.error as ApiError | null,
    refetch: () => void query.refetch(),
  };
}
