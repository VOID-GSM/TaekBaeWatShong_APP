import type { Parcel as ServerParcel } from '@taekbae/types';

import { summarizeParcels, toParcelCards } from '../parcel-card';

function serverParcel(overrides: Partial<ServerParcel>): ServerParcel {
  return {
    id: 1,
    deliveryCompany: 'CJ대한통운',
    invoiceNumber: '604122378890',
    alias: '겨울 패딩',
    status: 'PENDING',
    createdAt: '2026-07-01T10:00:00',
    ...overrides,
  };
}

const now = new Date(2026, 6, 7, 12, 0);

describe('toParcelCards', () => {
  it('서버 필드를 카드 모델로 옮긴다', () => {
    const [card] = toParcelCards(
      [serverParcel({ status: 'ARRIVED', zone: 'A', arrivedAt: '2026-07-07T09:48:00' })],
      now,
    );

    expect(card).toEqual({
      id: 1,
      name: '겨울 패딩',
      carrier: 'CJ대한통운',
      trackingNumber: '604122378890',
      status: 'arrived',
      createdAt: new Date(2026, 6, 1, 10),
      zone: 'A',
      arrivedAt: '07.07 09:48',
      timeLabel: '0일 02:12',
      claimedAt: undefined,
    });
  });

  it('PENDING 은 배송중, CLAIMED 는 수령 완료', () => {
    const cards = toParcelCards(
      [
        serverParcel({ id: 1, status: 'PENDING' }),
        serverParcel({ id: 2, status: 'CLAIMED', claimedAt: '2026-07-06T18:20:00' }),
      ],
      now,
    );

    expect(cards.map((c) => c.status)).toEqual(['inTransit', 'claimed']);
    expect(cards[1]?.claimedAt).toBe('07.06 18:20');
  });

  it('unclaimedDays 가 있으면 서버 기준으로 방치를 판단한다', () => {
    const arrivedAt = '2026-07-07T11:00:00';
    const cards = toParcelCards(
      [
        serverParcel({ id: 1, status: 'ARRIVED', arrivedAt, unclaimedDays: 1 }),
        serverParcel({
          id: 2,
          status: 'ARRIVED',
          arrivedAt: '2026-07-01T11:00:00',
          unclaimedDays: 0,
        }),
      ],
      now,
    );

    expect(cards.map((c) => c.status)).toEqual(['overdue', 'arrived']);
  });

  it('unclaimedDays 가 없으면 도착 후 24시간이 지났는지로 판단한다', () => {
    const cards = toParcelCards(
      [
        serverParcel({ id: 1, status: 'ARRIVED', arrivedAt: '2026-07-06T12:00:00' }),
        serverParcel({ id: 2, status: 'ARRIVED', arrivedAt: '2026-07-06T12:01:00' }),
      ],
      now,
    );

    expect(cards.map((c) => c.status)).toEqual(['overdue', 'arrived']);
  });

  it('모르는 상태의 택배는 뺀다', () => {
    expect(toParcelCards([serverParcel({ status: 'RETURNED' })], now)).toEqual([]);
  });
});

describe('summarizeParcels', () => {
  it('전체·보관 중(방치 포함)·방치 개수를 센다', () => {
    const cards = toParcelCards(
      [
        serverParcel({ id: 1, status: 'PENDING' }),
        serverParcel({ id: 2, status: 'ARRIVED', arrivedAt: '2026-07-07T11:00:00' }),
        serverParcel({ id: 3, status: 'ARRIVED', arrivedAt: '2026-07-01T11:00:00' }),
        serverParcel({ id: 4, status: 'CLAIMED' }),
      ],
      now,
    );

    expect(summarizeParcels(cards)).toEqual({ total: 4, arrived: 2, overdue: 1 });
  });
});
