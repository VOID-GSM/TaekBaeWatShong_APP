# 폼 패턴 (react-hook-form + zod v4 + @hookform/resolvers)

## 배치

- 스키마: 서버 요청 바디와 같으면 `@taekbae/types`의 스키마를 재사용·확장한다. 화면 전용 검증(비밀번호 확인 등)만 feature `model/`에 둔다.
- 폼 훅: `features/<action>/model/use-<action>-form.ts` — useForm + mutation 연결.
- 폼 UI: `features/<action>/ui/<action>-form.tsx`.
- 입력 컴포넌트(TextField 등)는 도메인 중립이므로 `shared/ui`. react-hook-form을 모르게 만들고, `Controller`로 연결한다.

## 템플릿

```ts
// features/auth-login/model/use-login-form.ts
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useLoginMutation } from '@taekbae/api';

const loginFormSchema = z.object({
  studentId: z.string().min(1, '학번을 입력해 주세요.'),
  password: z.string().min(8, '비밀번호는 8자 이상입니다.'),
});
export type LoginFormValues = z.infer<typeof loginFormSchema>;

export function useLoginForm() {
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { studentId: '', password: '' },
    mode: 'onBlur',
  });
  const login = useLoginMutation();

  const onSubmit = form.handleSubmit((values) => login.mutateAsync(values));

  return { form, onSubmit, isSubmitting: login.isPending, error: login.error };
}
```

```tsx
// features/auth-login/ui/login-form.tsx
<Controller
  control={form.control}
  name="studentId"
  render={({ field, fieldState }) => (
    <TextField
      label="학번"
      value={field.value}
      onChangeText={field.onChange}
      onBlur={field.onBlur}
      errorMessage={fieldState.error?.message}
      returnKeyType="next"
    />
  )}
/>
```

## 체크

- 에러 메시지는 한국어, 사용자가 무엇을 고쳐야 하는지 말한다.
- 제출 중 버튼 비활성화 + 중복 제출 방지 (`isSubmitting`).
- 서버 에러(4xx)는 `form.setError`로 필드 또는 root에 매핑.
- 키보드: `KeyboardAvoidingView`(iOS `padding`) 또는 스크롤 컨테이너, `returnKeyType`과 다음 필드 포커스.
- 비밀번호 필드 `secureTextEntry`, `autoCapitalize="none"`, `textContentType`/`autoComplete` 지정.
