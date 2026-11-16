import { parcelListResponseSchema, reportCreateRequestSchema, reportSchema } from '@taekbae/types';

const parcel = {
  id: 1,
  deliveryCompany: 'CJ대한통운',
  invoiceNumber: '604122378890',
  alias: '겨울 패딩',
  ownerName: '홍길동',
  zone: 'A',
  status: 'ARRIVED',
  arrivedAt: '2026-07-06T15:30:00.123456',
  claimedAt: null,
  unclaimedDays: 2,
  createdAt: '2026-07-05T09:00:00',
};

describe('parcelListResponseSchema', () => {
  it('서버 응답을 파싱한다 (소수 초, null 필드 포함)', () => {
    expect(parcelListResponseSchema.parse({ parcels: [parcel] }).parcels[0]).toEqual(parcel);
  });

  it('선택 필드가 빠져 있어도 파싱한다', () => {
    const { ownerName: _o, zone: _z, arrivedAt: _a, claimedAt: _c, ...required } = parcel;
    expect(parcelListResponseSchema.safeParse({ parcels: [required] }).success).toBe(true);
  });

  it.each([
    ['status', { ...parcel, status: 'LOST' }],
    ['zone', { ...parcel, zone: 'Z' }],
    ['id', { ...parcel, id: '1' }],
    ['createdAt', { ...parcel, createdAt: '2026. 07. 05' }],
  ])('%s 가 스펙과 다르면 실패한다', (_field, value) => {
    expect(parcelListResponseSchema.safeParse({ parcels: [value] }).success).toBe(false);
  });
});

describe('reportSchema', () => {
  const report = {
    id: 3,
    invoiceNumber: '604122378890',
    alias: '겨울 패딩',
    lostEstimatedAt: '2026-07-06T15:30:00',
    content: '현관 앞에 없어요',
    progress: 'RECEIVED',
    createdAt: '2026-07-06T16:00:00.5',
  };

  it('ReportCreateResponse 를 파싱한다', () => {
    expect(reportSchema.parse(report)).toEqual(report);
  });

  it('progress 가 스펙과 다르면 실패한다', () => {
    expect(reportSchema.safeParse({ ...report, progress: 'CLOSED' }).success).toBe(false);
  });
});

describe('reportCreateRequestSchema', () => {
  const request = {
    invoiceNumber: '604122378890',
    lostEstimatedAt: '2026-07-06T15:30:00',
    content: '현관 앞에 없어요',
  };

  it('오프셋 없는 LocalDateTime 을 받는다', () => {
    expect(reportCreateRequestSchema.safeParse(request).success).toBe(true);
  });

  it.each([
    ['빈 운송장 번호', { ...request, invoiceNumber: '' }],
    ['공백뿐인 내용', { ...request, content: '   ' }],
    ['표시 형식 날짜', { ...request, lostEstimatedAt: '2026. 07. 06 15:30' }],
  ])('%s 는 거부한다', (_case, value) => {
    expect(reportCreateRequestSchema.safeParse(value).success).toBe(false);
  });
});
