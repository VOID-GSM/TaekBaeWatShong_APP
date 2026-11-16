import { type ApiError, parcelQueries } from '@taekbae/api';
import type { Parcel } from '@taekbae/types';
import { useQuery } from '@tanstack/react-query';

export interface UseMyParcelResult {
  parcel: Parcel | undefined;
  /** 아직 데이터가 없다 (요청 중이거나, 오프라인이라 요청이 멈춘 상태 포함). */
  isPending: boolean;
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
    // isLoading(isPending && isFetching) 은 오프라인으로 멈춘 쿼리에서 false 라 '택배 없음'으로 오인된다.
    isPending: query.isPending,
    // @taekbae/api 의 요청 함수는 실패를 모두 ApiError 로 정규화한다.
    error: query.error as ApiError | null,
    refetch: () => void query.refetch(),
  };
}
