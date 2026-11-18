import { formatElapsed, toOverdueRanks } from '../overdue-rank';

const NOW = new Date(2026, 10, 18, 12, 0, 0);

describe('formatElapsed', () => {
  it('지난 시간을 "일 시:분"으로 보여준다', () => {
    expect(formatElapsed(((3 * 24 + 7) * 60 + 12) * 60 * 1000)).toBe('3일 07:12');
  });
});

describe('toOverdueRanks', () => {
  const rank = (ownerName: string, arrivedAt: string, zone: string | null = 'C') => ({
    rank: 1,
    ownerName,
    zone,
    arrivedAt,
  });

  it('도착 후 24시간이 지난 택배만 오래된 순으로 순위를 매긴다', () => {
    const ranks = toOverdueRanks(
      [
        rank('이도윤', '2026-11-17T11:00:00', null), // 25시간 · 구역 미배정
        rank('박서연', '2026-11-15T04:48:00'), // 3일 7시간 12분
        rank('김민준', '2026-11-17T13:00:00'), // 23시간 — 방치 아님
        rank('최지우', 'unknown'),
      ],
      NOW,
    );

    expect(ranks).toEqual([
      { rank: 1, ownerName: '박서연', zone: 'C', overdueFor: '3일 07:12' },
      { rank: 2, ownerName: '이도윤', zone: null, overdueFor: '1일 01:00' },
    ]);
  });

  it('정확히 24시간이 지나면 방치자로 본다', () => {
    expect(toOverdueRanks([rank('박서연', '2026-11-17T12:00:00')], NOW)).toHaveLength(1);
  });
});
