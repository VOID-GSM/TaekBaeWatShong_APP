import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateDriverQrMutation } from '@taekbae/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { normalizeDriverName } from '@/entities/driver';

import { issuedDriverQrQuery, saveIssuedDriverQr } from './issued-driver-qr';

const createDriverQrFormSchema = z.object({
  driverName: z
    .string()
    .transform(normalizeDriverName)
    .pipe(z.string().min(1, '기사님 이름을 입력해 주세요.')),
  deliveryCompany: z.string().trim().min(1, '택배사를 입력해 주세요.'),
});

export type CreateDriverQrFormInput = z.input<typeof createDriverQrFormSchema>;
export type CreateDriverQrFormValues = z.output<typeof createDriverQrFormSchema>;

/**
 * 기사 QR 발급 폼. 서버는 호출할 때마다 새 기사·새 QR 을 만든다 — 같은 이름으로 다시 눌러도 이전 QR 을 돌려주지 않는다.
 * 그래서 발급 결과(`qr`)는 이 기기에 저장해 앱을 다시 켜도 보여 주고, 새로 발급하면 바꿔 저장한다.
 */
export function useCreateDriverQrForm() {
  const queryClient = useQueryClient();
  const mutation = useCreateDriverQrMutation();
  const issued = useQuery(issuedDriverQrQuery);
  const form = useForm<CreateDriverQrFormInput, unknown, CreateDriverQrFormValues>({
    resolver: zodResolver(createDriverQrFormSchema),
    defaultValues: { driverName: '', deliveryCompany: '' },
    mode: 'onSubmit',
  });

  const onSubmit = form.handleSubmit(async (values) => {
    // 실패 메시지는 mutation.error 로 보여 준다.
    const qr = await mutation.mutateAsync(values).catch(() => undefined);
    if (!qr) return;
    queryClient.setQueryData(issuedDriverQrQuery.queryKey, qr);
    // 저장에 실패해도 지금 화면에는 보여 준다 — 다음 실행 때만 사라진다.
    await saveIssuedDriverQr(qr).catch(() => undefined);
  });

  return {
    form,
    onSubmit,
    qr: issued.data ?? undefined,
    error: mutation.error,
    isPending: mutation.isPending,
  };
}
