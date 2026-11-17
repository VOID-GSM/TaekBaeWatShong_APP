import type { LostReport } from '../model/lost-report';

/** `김민준 · 20614`, `이선생님 · 선생님` */
export function formatReporter({ name, role, studentNumber }: LostReport['reporter']): string {
  const detail = role === 'STUDENT' ? (studentNumber ?? '학생') : '선생님';
  return `${name} · ${detail}`;
}

/** `CJ대한통운 · 6041 2237 8890` — 운송장 번호는 4자리씩 띄운다. */
export function formatWaybill({ carrier, trackingNumber }: LostReport): string {
  const grouped = trackingNumber.replace(/\s/g, '').replace(/(.{4})(?=.)/g, '$1 ');
  return `${carrier} · ${grouped}`;
}

/** `2026.07.06 15:30` (기기 시간대 기준) */
export function formatLostAt(isoString: string): string {
  const date = new Date(isoString);
  const pad = (value: number) => String(value).padStart(2, '0');

  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}
