import { INVOICE_NUMBER_LENGTH, normalizeInvoiceNumber } from '@taekbae/utils';
import { z } from 'zod';

import { PARCEL_CARRIERS } from '@/entities/parcel';

export const ALIAS_MAX_LENGTH = 20;

/** 필드 이름은 백엔드 `POST /parcel` 요청과 같다. */
export const registerParcelSchema = z.object({
  invoiceNumber: z
    .string()
    .transform(normalizeInvoiceNumber)
    .pipe(
      z
        .string()
        .min(1, '운송장 번호를 입력해 주세요.')
        .min(INVOICE_NUMBER_LENGTH.min, '운송장 번호를 다시 확인해 주세요.')
        .max(INVOICE_NUMBER_LENGTH.max, '운송장 번호를 다시 확인해 주세요.'),
    ),
  deliveryCompany: z.enum(PARCEL_CARRIERS, { error: '택배사를 선택해 주세요.' }),
  alias: z
    .string()
    .trim()
    .max(ALIAS_MAX_LENGTH, `상품명은 ${ALIAS_MAX_LENGTH}자 이내로 입력해 주세요.`)
    .transform((value) => (value === '' ? undefined : value)),
});

export type RegisterParcelFormInput = z.input<typeof registerParcelSchema>;
export type RegisterParcelValues = z.output<typeof registerParcelSchema>;
