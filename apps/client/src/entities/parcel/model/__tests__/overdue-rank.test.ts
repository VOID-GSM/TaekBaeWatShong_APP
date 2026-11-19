import { formatOverdueFor, toOverdueRanks } from '../overdue-rank';

const NOW = new Date(2026, 10, 18, 12, 0, 0);

describe('formatOverdueFor', () => {
  it('지난 시간을 "일 시:분"으로 보여준다', () => {
    expect(formatOverdueFor(((3 * 24 + 7) * 60 + 12) * 60 * 1000)).toBe('3일 07:12');
  });

  it('음수는 0 으로 본다', () => {
    expect(formatOverdueFor(-5 * 60 * 1000)).toBe('0일 00:00');
  });
});

describe('toOverdueRanks', () => {
  const rank = (rank: number, ownerName: string, arrivedAt: string, zone: string | null = 'C') => ({
    rank,
    ownerName,
    zone,
    arrivedAt,
  });

  it('서버 순위를 그대로 두고 방치 시간만 계산한다', () => {
    const ranks = toOverdueRanks(
      [
        rank(1, '박서연', '2026-11-15T04:48:00'), // 3일 7시간 12분
        rank(2, '이도윤', '2026-11-17T11:00:00', null), // 25시간 · 구역 미배정
      ],
      NOW,
    );

    expect(ranks).toEqual([
      { rank: 1, ownerName: '박서연', zone: 'C', overdueFor: '3일 07:12' },
      { rank: 2, ownerName: '이도윤', zone: null, overdueFor: '1일 01:00' },
    ]);
  });

  it('기기 시각 기준 24시간이 안 됐거나 도착 시각을 읽을 수 없어도 빼지 않는다', () => {
    const ranks = toOverdueRanks(
      [rank(1, '김민준', '2026-11-17T21:00:00'), rank(2, '최지우', 'unknown')],
      NOW,
    );

    expect(ranks.map((item) => item.overdueFor)).toEqual(['0일 15:00', '0일 00:00']);
  });
});
