/** 택배 보관 구역(선반 칸). */
export interface Zone {
  /** 구역 문자 A~F */
  letter: string;
  /** 보관 중인 택배 수 */
  count: number;
}
