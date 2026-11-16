import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import {
  type RegisterParcelFormInput,
  registerParcelSchema,
  type RegisterParcelValues,
} from './register-parcel-schema';

/**
 * 택배 등록 폼. 등록 API 연동 전이라 제출 동작은 호출하는 쪽에서 받는다.
 * API 가 연결되면 여기서 mutation 을 호출한다.
 */
export function useRegisterParcelForm(
  onValid?: (values: RegisterParcelValues) => void | Promise<void>,
) {
  const form = useForm<RegisterParcelFormInput, unknown, RegisterParcelValues>({
    resolver: zodResolver(registerParcelSchema),
    defaultValues: { invoiceNumber: '', deliveryCompany: undefined, alias: '' },
    mode: 'onSubmit',
  });

  const onSubmit = form.handleSubmit((values) => onValid?.(values));

  return { form, onSubmit, isSubmitting: form.formState.isSubmitting };
}
