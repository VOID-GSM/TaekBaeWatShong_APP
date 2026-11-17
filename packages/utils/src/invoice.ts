/** 국내 택배 운송장 번호 자릿수. 실제 조회 가능 여부는 백엔드가 검증한다. */
export const INVOICE_NUMBER_LENGTH = { min: 10, max: 14 } as const;

/** 숫자로만 된 운송장 번호를 4자리씩 띄워 쓴다. 숫자가 아닌 문자가 섞여 있으면 그대로 돌려준다. */
export function formatInvoiceNumber(invoiceNumber: string): string {
  if (!/^\d+$/.test(invoiceNumber)) return invoiceNumber;
  return invoiceNumber.replace(/(\d{4})(?=\d)/g, '$1 ');
}

/** 입력값에서 숫자만 남긴다. 붙여 넣은 `6041-2237-8890` 같은 값도 받는다. */
export function normalizeInvoiceNumber(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * 입력칸용 서식. 숫자만 남기고 최대 자릿수를 넘는 숫자는 버린 뒤 4자리씩 띄운다.
 * 서버에서 받은 값을 보여 줄 때는 원문을 지키는 `formatInvoiceNumber` 를 쓴다.
 */
export function formatInvoiceNumberInput(value: string): string {
  return formatInvoiceNumber(normalizeInvoiceNumber(value).slice(0, INVOICE_NUMBER_LENGTH.max));
}
