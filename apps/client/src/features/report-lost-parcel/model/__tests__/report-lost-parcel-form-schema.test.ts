import { reportLostParcelFormSchema } from '../report-lost-parcel-form-schema';

const NOW = new Date(2026, 6, 6, 15, 30);

function messages(values: { lostEstimatedAt: string; content: string }) {
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
      lostEstimatedAt: '2026. 07. 06 15:30',
      content: '  현관 앞에 없어요 ',
    });

    expect(result).toEqual({ lostEstimatedAt: '2026. 07. 06 15:30', content: '현관 앞에 없어요' });
  });

  it.each(['2026-07-06 15:30', '2026. 02. 30 10:00', ''])(
    '형식이 다르면 형식 안내 문구 (%s)',
    (lostEstimatedAt) => {
      expect(messages({ lostEstimatedAt, content: '내용' })).toEqual([
        '분실 예상 시각을 선택해 주세요.',
      ]);
    },
  );

  it('현재보다 이후 시각이면 거부한다', () => {
    expect(messages({ lostEstimatedAt: '2026. 07. 06 15:31', content: '내용' })).toEqual([
      '현재보다 이후 시각은 선택할 수 없어요.',
    ]);
  });

  it('내용이 비었거나 공백뿐이면 거부한다', () => {
    expect(messages({ lostEstimatedAt: '2026. 07. 06 15:00', content: '   ' })).toEqual([
      '상세 내용을 입력해 주세요.',
    ]);
  });

  it('내용이 1000자를 넘으면 거부한다', () => {
    expect(messages({ lostEstimatedAt: '2026. 07. 06 15:00', content: 'a'.repeat(1001) })).toEqual([
      '상세 내용은 1000자 이내로 입력해 주세요.',
    ]);
    expect(messages({ lostEstimatedAt: '2026. 07. 06 15:00', content: 'a'.repeat(1000) })).toEqual(
      [],
    );
  });
});
