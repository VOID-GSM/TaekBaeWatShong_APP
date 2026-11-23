import type {
  DriverQr,
  DriverQrCreateRequest,
  DriverQrScanRequest,
  DriverQrScanResult,
} from '@taekbae/types';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';

import type { ApiError } from '../client';
import { createDriverQr, scanDriverQr } from './driver.api';

// 기사 목록·스캔 기록 조회 API 가 아직 없어 무효화할 캐시가 없다. 조회가 생기면 driverKeys 를 만들고 여기서 무효화한다.

export function useCreateDriverQrMutation(): UseMutationResult<
  DriverQr,
  ApiError,
  DriverQrCreateRequest
> {
  return useMutation<DriverQr, ApiError, DriverQrCreateRequest>({ mutationFn: createDriverQr });
}

export function useScanDriverQrMutation(): UseMutationResult<
  DriverQrScanResult,
  ApiError,
  DriverQrScanRequest
> {
  return useMutation<DriverQrScanResult, ApiError, DriverQrScanRequest>({
    mutationFn: scanDriverQr,
  });
}
