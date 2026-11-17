import { formatInvoiceNumber, normalizeInvoiceNumber } from '@taekbae/utils';

describe('invoice number', () => {
  it('숫자만 남긴다', () => {
    expect(normalizeInvoiceNumber('6041-2237 8890')).toBe('604122378890');
  });

  it('4자리씩 띄워 보여준다', () => {
    expect(formatInvoiceNumber('604122378890')).toBe('6041 2237 8890');
    expect(formatInvoiceNumber('60412')).toBe('6041 2');
  });

  it('14자리를 넘는 숫자는 잘라낸다', () => {
    expect(formatInvoiceNumber('1234567890123456')).toBe('1234 5678 9012 34');
  });
});
