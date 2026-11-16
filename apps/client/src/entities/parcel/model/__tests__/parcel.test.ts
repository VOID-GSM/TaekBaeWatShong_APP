import { filterParcels, type Parcel } from '../parcel';

function parcel(overrides: Partial<Parcel>): Parcel {
  return {
    id: '1',
    name: '겨울 패딩',
    carrier: 'CJ대한통운',
    trackingNumber: '6041 2237 8890',
    status: 'inTransit',
    createdAt: '2026-07-01T10:00:00',
    ...overrides,
  };
}

describe('filterParcels', () => {
  const parcels = [
    parcel({ id: '1', createdAt: '2026-07-01T10:00:00' }),
    parcel({ id: '2', status: 'arrived', createdAt: '2026-07-03T10:00:00' }),
    parcel({ id: '3', status: 'claimed', createdAt: '2026-07-02T10:00:00' }),
    parcel({ id: '4', status: 'overdue', createdAt: '2026-07-04T10:00:00' }),
  ];
  const ids = (filter: Parameters<typeof filterParcels>[1]) =>
    filterParcels(parcels, filter).map((p) => p.id);

  it('최신순은 전체를 등록일 최신순으로 보여준다', () => {
    expect(ids('latest')).toEqual(['4', '2', '3', '1']);
  });

  it('상태별로 고른다 — 배송중은 방치를 포함한다', () => {
    expect(ids('claimed')).toEqual(['3']);
    expect(ids('arrived')).toEqual(['4', '2']);
    expect(ids('pending')).toEqual(['1']);
  });
});
