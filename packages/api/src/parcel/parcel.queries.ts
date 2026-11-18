import type { MyParcelListParams, Parcel, ParcelRegisterRequest } from '@taekbae/types';
import {
  queryOptions,
  useMutation,
  type UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';

import type { ApiError } from '../client';
import {
  fetchMyParcels,
  fetchUnclaimedRanking,
  fetchZoneSummary,
  registerParcel,
} from './parcel.api';
import { parcelKeys } from './parcel.keys';

export const parcelQueries = {
  mine: (params: MyParcelListParams = {}) =>
    queryOptions({ queryKey: parcelKeys.mine(params), queryFn: () => fetchMyParcels(params) }),
  zoneSummary: () =>
    queryOptions({ queryKey: parcelKeys.zoneSummary(), queryFn: fetchZoneSummary }),
  unclaimedRanking: () =>
    queryOptions({ queryKey: parcelKeys.unclaimedRanking(), queryFn: fetchUnclaimedRanking }),
};

export function useRegisterParcelMutation(): UseMutationResult<
  Parcel,
  ApiError,
  ParcelRegisterRequest
> {
  const queryClient = useQueryClient();
  return useMutation<Parcel, ApiError, ParcelRegisterRequest>({
    mutationFn: registerParcel,
    // 재조회를 기다리지 않는다 — 기다리면 등록 버튼이 목록 재조회가 끝날 때까지 로딩으로 남는다.
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: parcelKeys.all });
    },
  });
}
