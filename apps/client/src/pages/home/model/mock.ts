import type { Parcel, ParcelSummary } from '@/entities/parcel';

/** API 연동 전 화면 확인용 더미 데이터. 연동 시 쿼리 훅으로 바꾸고 이 파일은 지운다. */
export const MOCK_SUMMARY: ParcelSummary = { total: 4, arrived: 2, overdue: 1 };

export const MOCK_PARCELS: Parcel[] = [
  {
    id: '1',
    name: '겨울 패딩',
    carrier: 'CJ대한통운',
    trackingNumber: '6041 2237 8890',
    status: 'overdue',
    createdAt: '2026-07-04T10:00:00',
    zone: 'C',
    arrivedAt: '07.06 16:40',
    timeLabel: '1일 03:24:17',
  },
  {
    id: '2',
    name: '무선 이어폰',
    carrier: '한진택배',
    trackingNumber: '3388 1102 5567',
    status: 'arrived',
    createdAt: '2026-07-05T09:00:00',
    zone: 'A',
    arrivedAt: '07.07 07:30',
    timeLabel: '02:11:48',
  },
  {
    id: '3',
    name: '문제집 세트',
    carrier: '롯데택배',
    trackingNumber: '7720 9945 0031',
    status: 'inTransit',
    createdAt: '2026-07-06T18:00:00',
    stepIndex: 2,
  },
  {
    id: '4',
    name: '운동화',
    carrier: '우체국택배',
    trackingNumber: '6892 0013 4475',
    status: 'claimed',
    createdAt: '2026-07-03T14:00:00',
    zone: 'B',
    claimedAt: '07.05 18:20',
  },
];
