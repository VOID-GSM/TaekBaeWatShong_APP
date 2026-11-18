import {
  type AdminReport,
  adminReportListResponseSchema,
  type Report,
  type ReportCreateRequest,
  reportSchema,
} from '@taekbae/types';

import { api, parseResponse } from '../client';

/** `POST /report` — 분실 신고 생성. */
export async function createReport(request: ReportCreateRequest): Promise<Report> {
  const { data } = await api().post('/report', request);
  return parseResponse(reportSchema, data);
}

/** `GET /report` — 모든 분실 신고 (관리자). */
export async function fetchAllReports(): Promise<AdminReport[]> {
  const { data } = await api().get('/report');
  return parseResponse(adminReportListResponseSchema, data).reports;
}
