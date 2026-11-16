import { zodResolver } from '@hookform/resolvers/zod';
import { type ApiError, useCreateReportMutation } from '@taekbae/api';
import type { Report } from '@taekbae/types';
import { formatDateTimeInput, parseDateTimeInput } from '@taekbae/utils';
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

  const handleSubmit = form.handleSubmit(async (values) => {
    const lostEstimatedAt = parseDateTimeInput(values.lostEstimatedAt);
    // 스키마가 이미 검증했으므로 null 이 될 수 없다.
    if (lostEstimatedAt === null || mutation.isPending) return;

    try {
      const report = await mutation.mutateAsync({
        invoiceNumber,
        lostEstimatedAt,
        content: values.content,
      });
      onSuccess?.(report);
    } catch {
      // 실패 문구는 mutation.error 로 노출한다.
    }
  });

  return {
    control: form.control,
    submit: () => void handleSubmit(),
    isSubmitting: form.formState.isSubmitting || mutation.isPending,
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
