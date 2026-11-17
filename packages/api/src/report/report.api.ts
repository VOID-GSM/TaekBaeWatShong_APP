import { type Report, type ReportCreateRequest, reportSchema } from '@taekbae/types';

import { api, parseResponse } from '../client';

/** `POST /report` — 분실 신고 생성. */
export async function createReport(request: ReportCreateRequest): Promise<Report> {
  const { data } = await api().post('/report', request);
  return parseResponse(reportSchema, data);
}
