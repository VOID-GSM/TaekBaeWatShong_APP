import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const signUpFormSchema = z.object({
  name: z.string().trim().min(1, '이름을 입력해 주세요.'),
});

export type SignUpFormValues = z.infer<typeof signUpFormSchema>;

/**
 * 관리자 가입 폼. 가입 API 가 아직 정해지지 않아 제출 동작은 호출하는 쪽에서 받는다.
 * API 가 정해지면 여기서 mutation 을 연결한다.
 */
export function useSignUpForm(onValid?: (values: SignUpFormValues) => void | Promise<void>) {
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: { name: '' },
    mode: 'onBlur',
  });

  const onSubmit = form.handleSubmit((values) => onValid?.(values));

  return { form, onSubmit, isSubmitting: form.formState.isSubmitting };
}
