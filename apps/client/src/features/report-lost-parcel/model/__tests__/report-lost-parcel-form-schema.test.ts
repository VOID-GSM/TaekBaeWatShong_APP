import { reportLostParcelFormSchema } from '../report-lost-parcel-form-schema';

const NOW = new Date(2026, 6, 6, 15, 30);
const BEFORE = new Date(2026, 6, 6, 15, 0);

function messages(values: { lostEstimatedAt: unknown; content: string }) {
  const result = reportLostParcelFormSchema.safeParse(values);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('reportLostParcelFormSchema', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: NOW });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('올바른 값이면 통과하고 내용 앞뒤 공백을 지운다', () => {
    const result = reportLostParcelFormSchema.parse({
      lostEstimatedAt: NOW,
      content: '  현관 앞에 없어요 ',
    });

    expect(result).toEqual({ lostEstimatedAt: NOW, content: '현관 앞에 없어요' });
  });

  it.each([undefined, null, '2026. 07. 06 15:30', new Date(Number.NaN)])(
    '시각이 없거나 Date 가 아니면 선택 안내 문구 (%s)',
    (lostEstimatedAt) => {
      expect(messages({ lostEstimatedAt, content: '내용' })).toEqual([
        '분실 예상 시각을 선택해 주세요.',
      ]);
    },
  );

  it('현재보다 이후 시각이면 거부한다', () => {
    expect(messages({ lostEstimatedAt: new Date(2026, 6, 6, 15, 31), content: '내용' })).toEqual([
      '현재보다 이후 시각은 선택할 수 없어요.',
    ]);
  });

  it('미래 여부는 스키마를 만든 시각이 아니라 검증하는 시각과 비교한다', () => {
    const later = new Date(2026, 6, 6, 15, 40);
    jest.setSystemTime(later);

    expect(messages({ lostEstimatedAt: later, content: '내용' })).toEqual([]);
  });

  it('내용이 비었거나 공백뿐이면 거부한다', () => {
    expect(messages({ lostEstimatedAt: BEFORE, content: '   ' })).toEqual([
      '상세 내용을 입력해 주세요.',
    ]);
  });

  it('내용이 1000자를 넘으면 거부한다', () => {
    expect(messages({ lostEstimatedAt: BEFORE, content: 'a'.repeat(1001) })).toEqual([
      '상세 내용은 1000자 이내로 입력해 주세요.',
    ]);
    expect(messages({ lostEstimatedAt: BEFORE, content: 'a'.repeat(1000) })).toEqual([]);
  });
});
