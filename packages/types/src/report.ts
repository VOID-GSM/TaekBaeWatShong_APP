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

export type ReportProgress = z.infer<typeof reportProgressSchema>;
export type Report = z.infer<typeof reportSchema>;
