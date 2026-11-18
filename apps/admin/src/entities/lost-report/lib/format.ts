import { formatInvoiceNumber, localDateTimeToDate } from '@taekbae/utils';

import type { LostReport } from '../model/lost-report';

/**
 * `김민준 · 20614`, `이선생님 · 선생님`. 학번·역할이 없으면 이름만 보여 준다.
 * (서버가 아직 학번·역할을 보내지 않음 — SERVER#26)
 */
export function formatReporter({
  reporterName,
  studentNumber,
  reporterRole,
}: Pick<LostReport, 'reporterName' | 'studentNumber' | 'reporterRole'>): string {
  if (studentNumber) return `${reporterName} · ${studentNumber}`;
  if (reporterRole === 'TEACHER') return `${reporterName} · 선생님`;
  return reporterName;
}

/** `CJ대한통운 · 6041 2237 8890`. 택배사가 없으면 운송장 번호만 보여 준다. */
export function formatWaybill({
  deliveryCompany,
  invoiceNumber,
}: Pick<LostReport, 'deliveryCompany' | 'invoiceNumber'>): string {
  const formatted = formatInvoiceNumber(invoiceNumber);
  return deliveryCompany ? `${deliveryCompany} · ${formatted}` : formatted;
}

/** 서버의 오프셋 없는 시각(`2026-07-06T15:30:00`)을 `2026.07.06 15:30` 으로 보여 준다. */
export function formatLostAt(localDateTime: string): string {
  const date = localDateTimeToDate(localDateTime);
  if (date === null) return localDateTime;
  const pad = (value: number) => String(value).padStart(2, '0');

  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}
