import type {
  MyParcelListParams,
  Parcel,
  ParcelClaimRequest,
  ParcelClaimResponse,
  ParcelCompleteRequest,
  ParcelRegisterRequest,
} from '@taekbae/types';
import {
  queryOptions,
  useMutation,
  type UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';

import type { ApiError } from '../client';
import {
  claimParcel,
  completeParcel,
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

export function useClaimParcelMutation(): UseMutationResult<
  ParcelClaimResponse,
  ApiError,
  ParcelClaimRequest
> {
  const queryClient = useQueryClient();
  return useMutation<ParcelClaimResponse, ApiError, ParcelClaimRequest>({
    mutationFn: claimParcel,
    // 회수한 택배가 '방금 회수한 택배'·홈 목록에 바로 반영되게 한다. 다음 스캔을 막지 않도록 기다리지 않는다.
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: parcelKeys.all });
    },
  });
}

export function useCompleteParcelMutation(): UseMutationResult<
  Parcel,
  ApiError,
  ParcelCompleteRequest
> {
  const queryClient = useQueryClient();
  return useMutation<Parcel, ApiError, ParcelCompleteRequest>({
    mutationFn: completeParcel,
    // 도착 처리한 택배가 목록·구역 요약에 반영되게 한다. 연속 스캔을 막지 않도록 기다리지 않는다.
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: parcelKeys.all });
    },
  });
}
