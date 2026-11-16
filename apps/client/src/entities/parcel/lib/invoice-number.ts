/** 국내 택배 운송장 번호 자릿수. 실제 조회 가능 여부는 백엔드가 검증한다. */
export const INVOICE_NUMBER_LENGTH = { min: 10, max: 14 } as const;

/** 입력값에서 숫자만 남긴다. 붙여 넣은 `6041-2237-8890` 같은 값도 받는다. */
export function normalizeInvoiceNumber(value: string): string {
  return value.replace(/\D/g, '');
}

/** `604122378890` → `6041 2237 8890`. 최대 자릿수를 넘는 숫자는 버린다. */
export function formatInvoiceNumber(value: string): string {
  return normalizeInvoiceNumber(value)
    .slice(0, INVOICE_NUMBER_LENGTH.max)
    .replace(/(\d{4})(?=\d)/g, '$1 ');
}
