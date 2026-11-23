import { filterParcels, type Parcel } from '../parcel';

function parcel(overrides: Partial<Parcel>): Parcel {
  return {
    id: 1,
    name: '겨울 패딩',
    carrier: 'CJ대한통운',
    trackingNumber: '604122378890',
    status: 'inTransit',
    createdAt: new Date(2026, 6, 1, 10),
    ...overrides,
  };
}

describe('filterParcels', () => {
  const parcels = [
    parcel({ id: 1, createdAt: new Date(2026, 6, 1, 10) }),
    parcel({ id: 2, status: 'arrived', createdAt: new Date(2026, 6, 3, 10) }),
    parcel({ id: 3, status: 'claimed', createdAt: new Date(2026, 6, 2, 10) }),
    parcel({ id: 4, status: 'overdue', createdAt: new Date(2026, 6, 4, 10) }),
  ];
  const ids = (filter: Parameters<typeof filterParcels>[1]) =>
    filterParcels(parcels, filter).map((p) => p.id);

  it('최신순은 전체를 등록일 최신순으로 보여준다', () => {
    expect(ids('latest')).toEqual([4, 2, 3, 1]);
  });

  it('상태별로 고른다 — 도착은 방치를 포함한다', () => {
    expect(ids('claimed')).toEqual([3]);
    expect(ids('arrived')).toEqual([4, 2]);
    expect(ids('pending')).toEqual([1]);
  });

  it('등록일이 없으면 id 가 큰 순으로 둔다', () => {
    const noDates = [parcel({ id: 1, createdAt: null }), parcel({ id: 2, createdAt: null })];
    expect(filterParcels(noDates, 'latest').map((p) => p.id)).toEqual([2, 1]);
  });
});
