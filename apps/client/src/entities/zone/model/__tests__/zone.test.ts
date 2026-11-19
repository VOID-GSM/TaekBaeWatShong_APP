import { toZoneShelves } from '../zone';

describe('toZoneShelves', () => {
  it('A~C는 왼쪽, D~F는 오른쪽 선반에 두고 응답에 없는 구역은 0개로 채운다', () => {
    const shelves = toZoneShelves([
      { zone: 'C', count: 5 },
      { zone: 'A', count: 3 },
      { zone: 'E', count: 2 },
      { zone: 'Z', count: 9 },
    ]);

    expect(shelves.leftShelf).toEqual([
      { letter: 'A', count: 3 },
      { letter: 'B', count: 0 },
      { letter: 'C', count: 5 },
    ]);
    expect(shelves.rightShelf).toEqual([
      { letter: 'D', count: 0 },
      { letter: 'E', count: 2 },
      { letter: 'F', count: 0 },
    ]);
  });
});
