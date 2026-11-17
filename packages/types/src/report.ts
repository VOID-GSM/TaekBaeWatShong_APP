import { z } from 'zod';

export const reportProgressSchema = z.enum(['RECEIVED', 'IN_PROGRESS', 'DONE']);

/** `POST /report` 요청. `lostEstimatedAt` 은 오프셋 없는 `"YYYY-MM-DDTHH:mm:ss"`. 값 검증은 폼 스키마가 맡는다. */
export interface ReportCreateRequest {
  invoiceNumber: string;
  lostEstimatedAt: string;
  content: string;
}

/** 서버 `ReportCreateResponse`. */
export const reportSchema = z.object({
  id: z.number(),
  invoiceNumber: z.string(),
  alias: z.string(),
  lostEstimatedAt: z.iso.datetime({ local: true }),
  content: z.string(),
  progress: reportProgressSchema,
  createdAt: z.iso.datetime({ local: true }),
});

/**
 * `GET /report`(관리자 전체 조회)의 신고 한 건 — 서버 `ReportSummary`.
 * `studentNumber`·`chatRoomId` 는 서버가 아직 채우지 않고(SERVER#26), `deliveryCompany`·`content`·`reporterRole` 은
 * 서버에 추가를 요청한 필드다. 모두 선택값으로 받아, 서버가 채우면 화면이 그대로 보여 준다.
 */
export const adminReportSchema = z.object({
  id: z.number(),
  reporterName: z.string(),
  studentNumber: z.string().nullish(),
  reporterRole: z.string().nullish(),
  alias: z.string(),
  invoiceNumber: z.string(),
  deliveryCompany: z.string().nullish(),
  lostEstimatedAt: z.iso.datetime({ local: true }),
  content: z.string().nullish(),
  progress: reportProgressSchema,
  chatRoomId: z.number().nullish(),
  createdAt: z.iso.datetime({ local: true }),
});

/** `GET /report` 응답. */
export const adminReportListResponseSchema = z.object({
  reports: z.array(adminReportSchema),
});

export type ReportProgress = z.infer<typeof reportProgressSchema>;
export type AdminReport = z.infer<typeof adminReportSchema>;
export type Report = z.infer<typeof reportSchema>;
