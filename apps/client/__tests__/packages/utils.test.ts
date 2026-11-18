import {
  formatDateTimeInput,
  formatInvoiceNumber,
  formatInvoiceNumberInput,
  formatLocalDateTime,
  localDateTimeToDate,
  normalizeInvoiceNumber,
  parseDateTimeInput,
} from '@taekbae/utils';

describe('formatInvoiceNumber', () => {
  it('숫자만 있으면 4자리씩 띄운다', () => {
    expect(formatInvoiceNumber('604122378890')).toBe('6041 2237 8890');
    expect(formatInvoiceNumber('1234567')).toBe('1234 567');
    expect(formatInvoiceNumber('1234')).toBe('1234');
  });

  it('숫자가 아닌 값은 그대로 둔다', () => {
    expect(formatInvoiceNumber('AB-1234')).toBe('AB-1234');
    expect(formatInvoiceNumber('')).toBe('');
  });
});

describe('normalizeInvoiceNumber', () => {
  it('숫자만 남긴다', () => {
    expect(normalizeInvoiceNumber('6041-2237 8890')).toBe('604122378890');
  });
});

describe('formatInvoiceNumberInput', () => {
  it('입력값을 숫자만 남겨 4자리씩 띄운다', () => {
    expect(formatInvoiceNumberInput('6041-2237 8890')).toBe('6041 2237 8890');
    expect(formatInvoiceNumberInput('60412')).toBe('6041 2');
  });

  it('14자리를 넘는 숫자는 잘라낸다', () => {
    expect(formatInvoiceNumberInput('1234567890123456')).toBe('1234 5678 9012 34');
  });
});

describe('formatDateTimeInput', () => {
  it('로컬 시각을 입력 형식으로 만든다', () => {
    expect(formatDateTimeInput(new Date(2026, 6, 6, 15, 30))).toBe('2026. 07. 06 15:30');
    expect(formatDateTimeInput(new Date(2026, 0, 1, 0, 5))).toBe('2026. 01. 01 00:05');
  });
});

describe('formatLocalDateTime', () => {
  it('기기 로컬 시각을 오프셋 없는 LocalDateTime 으로 만들고 초는 버린다', () => {
    expect(formatLocalDateTime(new Date(2026, 6, 6, 15, 30, 42))).toBe('2026-07-06T15:30:00');
    expect(formatLocalDateTime(new Date(2026, 0, 1, 0, 5))).toBe('2026-01-01T00:05:00');
  });
});

describe('parseDateTimeInput', () => {
  it('입력 형식을 LocalDateTime 문자열로 바꾼다', () => {
    expect(parseDateTimeInput('2026. 07. 06 15:30')).toBe('2026-07-06T15:30:00');
    expect(parseDateTimeInput(' 2026.7.6 9:05 ')).toBe('2026-07-06T09:05:00');
  });

  it('윤년 2월 29일은 허용한다', () => {
    expect(parseDateTimeInput('2028. 02. 29 00:00')).toBe('2028-02-29T00:00:00');
  });

  it.each([
    '',
    '2026-07-06 15:30',
    '2026. 07. 06',
    '2026. 13. 01 10:00',
    '2026. 00. 01 10:00',
    '2026. 02. 29 10:00',
    '2026. 04. 31 10:00',
    '2026. 07. 06 24:00',
    '2026. 07. 06 12:60',
    '0026. 07. 06 15:30',
    '1999. 12. 31 23:59',
  ])('형식이 다르거나 없는 날짜·2000년 이전이면 null (%s)', (input) => {
    expect(parseDateTimeInput(input)).toBeNull();
  });

  it('formatDateTimeInput 결과를 되돌릴 수 있다', () => {
    const date = new Date(2026, 10, 16, 8, 0);
    expect(parseDateTimeInput(formatDateTimeInput(date))).toBe('2026-11-16T08:00:00');
  });
});

describe('localDateTimeToDate', () => {
  it('오프셋 없는 문자열을 로컬 시각으로 읽는다', () => {
    expect(localDateTimeToDate('2026-07-06T15:30:00')).toEqual(new Date(2026, 6, 6, 15, 30));
    expect(localDateTimeToDate('2026-07-06T15:30:12.345')).toEqual(
      new Date(2026, 6, 6, 15, 30, 12),
    );
  });

  it('형식이 다르면 null', () => {
    expect(localDateTimeToDate('2026. 07. 06 15:30')).toBeNull();
  });
});
