import type { Report, ReportCreateRequest } from '@taekbae/types';
import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query';

import type { ApiError } from '../client';
import { parcelKeys } from '../parcel/parcel.keys';
import { createReport } from './report.api';

export function useCreateReportMutation(): UseMutationResult<
  Report,
  ApiError,
  ReportCreateRequest
> {
  const queryClient = useQueryClient();
  return useMutation<Report, ApiError, ReportCreateRequest>({
    mutationFn: createReport,
    // 재조회를 기다리지 않는다 — 기다리면 제출 버튼이 목록 재조회가 끝날 때까지 로딩으로 남는다.
    // 신고 목록 쿼리가 생기면 그 키도 여기서 invalidate 한다.
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: parcelKeys.all });
    },
  });
}
