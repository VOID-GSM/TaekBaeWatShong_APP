/** 택배 보관 구역(선반 칸). */
export interface Zone {
  /** 구역 문자 A~F */
  letter: string;
  /** 보관 중인 택배 수 */
  count: number;
}

/** 약도 선반 배치. 위칸부터 왼쪽 A·B·C, 오른쪽 D·E·F. */
export const LEFT_SHELF_LETTERS = ['A', 'B', 'C'] as const;
export const RIGHT_SHELF_LETTERS = ['D', 'E', 'F'] as const;

export interface ZoneShelves {
  leftShelf: Zone[];
  rightShelf: Zone[];
}

/** 서버 구역별 수를 선반 배치로 바꾼다. 응답에 없는 구역은 0개로 채우고, 약도에 없는 구역은 버린다. */
export function toZoneShelves(zones: readonly { zone: string; count: number }[]): ZoneShelves {
  const countOf = (letter: string) => zones.find((item) => item.zone === letter)?.count ?? 0;
  const toZones = (letters: readonly string[]) =>
    letters.map((letter) => ({ letter, count: countOf(letter) }));

  return { leftShelf: toZones(LEFT_SHELF_LETTERS), rightShelf: toZones(RIGHT_SHELF_LETTERS) };
}
