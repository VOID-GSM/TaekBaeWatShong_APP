import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateDriverQrMutation } from '@taekbae/api';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { normalizeDriverName } from '@/entities/driver';

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
 * 발급 결과(`qr`)는 다음 발급 전까지 화면에 남는다.
 */
export function useCreateDriverQrForm() {
  const mutation = useCreateDriverQrMutation();
  const form = useForm<CreateDriverQrFormInput, unknown, CreateDriverQrFormValues>({
    resolver: zodResolver(createDriverQrFormSchema),
    defaultValues: { driverName: '', deliveryCompany: '' },
    mode: 'onSubmit',
  });

  const onSubmit = form.handleSubmit(async (values) => {
    // 실패 메시지는 mutation.error 로 보여 준다.
    await mutation.mutateAsync(values).catch(() => undefined);
  });

  return {
    form,
    onSubmit,
    qr: mutation.data,
    error: mutation.error,
    isPending: mutation.isPending,
  };
}
