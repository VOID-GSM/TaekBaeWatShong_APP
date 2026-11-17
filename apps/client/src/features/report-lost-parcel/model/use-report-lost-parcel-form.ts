import { zodResolver } from '@hookform/resolvers/zod';
import { type ApiError, useCreateReportMutation } from '@taekbae/api';
import type { Report } from '@taekbae/types';
import { formatDateTimeInput, parseDateTimeInput } from '@taekbae/utils';
import { useEffect, useRef } from 'react';
import { type Control, useForm } from 'react-hook-form';

import {
  reportLostParcelFormSchema,
  type ReportLostParcelFormValues,
} from './report-lost-parcel-form-schema';

export interface UseReportLostParcelFormOptions {
  invoiceNumber: string;
  onSuccess?: (report: Report) => void;
}

export interface UseReportLostParcelFormResult {
  control: Control<ReportLostParcelFormValues>;
  submit: () => void;
  isSubmitting: boolean;
  submitError: string | null;
}

export function useReportLostParcelForm({
  invoiceNumber,
  onSuccess,
}: UseReportLostParcelFormOptions): UseReportLostParcelFormResult {
  const form = useForm<ReportLostParcelFormValues>({
    resolver: zodResolver(reportLostParcelFormSchema),
    // useForm 은 첫 렌더의 defaultValues 만 쓴다.
    defaultValues: createDefaultValues(),
    mode: 'onBlur',
  });
  const mutation = useCreateReportMutation();
  // 제출 중에 화면을 떠나도 요청은 끝까지 간다 — 그 뒤 onSuccess(뒤로가기)가 다른 화면에서 실행되지 않게 한다.
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // handleSubmit 을 렌더 중이 아니라 누를 때 만든다 — 핸들러 안에서 ref 를 읽기 때문이다.
  const submit = () =>
    void form.handleSubmit(async (values) => {
      const lostEstimatedAt = parseDateTimeInput(values.lostEstimatedAt);
      // 스키마가 이미 검증했으므로 null 이 될 수 없다.
      if (lostEstimatedAt === null) return;

      try {
        const report = await mutation.mutateAsync({
          invoiceNumber,
          lostEstimatedAt,
          content: values.content,
        });
        if (isMountedRef.current) onSuccess?.(report);
      } catch {
        // 실패 문구는 mutation.error 로 노출한다.
      }
    })();

  return {
    control: form.control,
    submit,
    // 핸들러가 mutateAsync 를 기다리므로 formState.isSubmitting 이 요청 끝까지 true 다.
    isSubmitting: form.formState.isSubmitting,
    submitError: mutation.error ? getSubmitErrorMessage(mutation.error) : null,
  };
}

function getSubmitErrorMessage(error: ApiError): string {
  // 403 은 서버가 message 없는 기본 에러 바디로 응답한다.
  if (error.status === 403) return '본인이 등록한 택배만 분실 신고할 수 있어요.';
  return error.message;
}

function createDefaultValues(): ReportLostParcelFormValues {
  return { lostEstimatedAt: formatDateTimeInput(new Date()), content: '' };
}
