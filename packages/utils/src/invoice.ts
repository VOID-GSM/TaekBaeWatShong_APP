/** 숫자로만 된 운송장 번호를 4자리씩 띄워 쓴다. 숫자가 아닌 문자가 섞여 있으면 그대로 돌려준다. */
export function formatInvoiceNumber(invoiceNumber: string): string {
  if (!/^\d+$/.test(invoiceNumber)) return invoiceNumber;
  return invoiceNumber.replace(/(\d{4})(?=\d)/g, '$1 ');
}
