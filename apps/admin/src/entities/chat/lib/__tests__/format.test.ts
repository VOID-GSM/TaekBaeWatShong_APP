import { formatRelativeTime } from '../format';

describe('formatRelativeTime', () => {
  const now = new Date(2026, 6, 6, 15, 30);

  it.each([
    [new Date(2026, 6, 6, 15, 29, 40), '방금 전'],
    [new Date(2026, 6, 6, 15, 31), '방금 전'],
    [new Date(2026, 6, 6, 15, 18), '12분 전'],
    [new Date(2026, 6, 6, 9, 0), '6시간 전'],
    [new Date(2026, 6, 5, 23, 0), '어제'],
    [new Date(2026, 6, 3, 10, 0), '07.03'],
  ])('%s → %s', (date, expected) => {
    expect(formatRelativeTime(date, now)).toBe(expected);
  });
});
