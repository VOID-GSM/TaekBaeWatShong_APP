import { groupMessagesByDate } from '../group-by-date';

const message = (id: number, createdAt: Date) => ({
  id,
  content: `m${id}`,
  isMine: id % 2 === 0,
  createdAt,
});

describe('groupMessagesByDate', () => {
  it('날짜가 바뀌는 지점마다 묶고 순서는 유지한다', () => {
    const sections = groupMessagesByDate([
      message(1, new Date(2026, 6, 6, 10, 0)),
      message(2, new Date(2026, 6, 6, 23, 59)),
      message(3, new Date(2026, 6, 7, 0, 1)),
    ]);
    expect(sections.map(({ date, messages }) => [date, messages.map((m) => m.id)])).toEqual([
      ['2026년 7월 6일', [1, 2]],
      ['2026년 7월 7일', [3]],
    ]);
  });

  it('메시지가 없으면 빈 배열', () => {
    expect(groupMessagesByDate([])).toEqual([]);
  });
});
