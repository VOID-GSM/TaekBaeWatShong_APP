import { zodResolver } from '@hookform/resolvers/zod';
import { useRegisterParcelMutation } from '@taekbae/api';
import type { Parcel } from '@taekbae/types';
import { useEffect, useRef, useState } from 'react';
import { type DefaultValues, useForm } from 'react-hook-form';

import {
  type RegisterParcelFormInput,
  registerParcelSchema,
  type RegisterParcelValues,
} from './register-parcel-schema';

export interface UseRegisterParcelFormOptions {
  onSuccess?: (parcel: Parcel) => void;
}

const DEFAULT_VALUES: DefaultValues<RegisterParcelFormInput> = {
  invoiceNumber: '',
  deliveryCompany: undefined,
  alias: '',
};

/** 택배 등록 폼. 제출하면 `POST /parcel` 로 등록하고, 성공하면 입력을 비운다. */
export function useRegisterParcelForm({ onSuccess }: UseRegisterParcelFormOptions = {}) {
  const form = useForm<RegisterParcelFormInput, unknown, RegisterParcelValues>({
    resolver: zodResolver(registerParcelSchema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onSubmit',
  });
  const mutation = useRegisterParcelMutation();
  const [registered, setRegistered] = useState<Parcel | null>(null);
  // 등록 중에 다른 탭으로 가도 요청은 끝까지 간다 — 그 뒤 화면 갱신이 사라진 화면에서 실행되지 않게 한다.
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
      setRegistered(null);
      try {
        const parcel = await mutation.mutateAsync(values);
        if (!isMountedRef.current) return;
        form.reset(DEFAULT_VALUES);
        mutation.reset();
        setRegistered(parcel);
        onSuccess?.(parcel);
      } catch {
        // 실패 문구는 mutation.error 로 노출한다.
      }
    })();

  return {
    form,
    submit,
    // 핸들러가 mutateAsync 를 기다리므로 formState.isSubmitting 이 요청 끝까지 true 다.
    isSubmitting: form.formState.isSubmitting,
    // 400(조회할 수 없는 운송장)·409(이미 등록됨)는 서버가 한국어 message 를 보내 ApiError.message 에 담긴다.
    submitError: mutation.error?.message ?? null,
    /** 방금 등록한 택배. 등록 완료 안내에 쓴다. */
    registered,
    /** 다음 입력을 시작할 때 등록 완료 안내를 지운다. */
    clearRegistered: () => setRegistered(null),
  };
}
