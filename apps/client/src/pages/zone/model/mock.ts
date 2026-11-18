import type { OverdueRank } from '@/entities/parcel';
import type { Zone } from '@/entities/zone';

/** API 연동 전 화면 확인용 더미 데이터. 연동 시 쿼리 훅으로 바꾸고 이 파일은 지운다. */
export const MOCK_LEFT_SHELF: Zone[] = [
  { letter: 'A', count: 3 },
  { letter: 'B', count: 1 },
  { letter: 'C', count: 5 },
];

export const MOCK_RIGHT_SHELF: Zone[] = [
  { letter: 'D', count: 0 },
  { letter: 'E', count: 2 },
  { letter: 'F', count: 1 },
];

export const MOCK_OVERDUE_TOP3: OverdueRank[] = [
  { rank: 1, ownerName: '박서연', parcelName: '겨울 패딩', zone: 'C', overdueFor: '3일 07:12' },
  { rank: 2, ownerName: '김민준', parcelName: '문제집 세트', zone: 'C', overdueFor: '2일 01:40' },
  { rank: 3, ownerName: '이도윤', parcelName: '신발', zone: 'A', overdueFor: '1일 12:05' },
];
