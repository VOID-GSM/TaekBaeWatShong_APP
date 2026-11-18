import { z } from 'zod';

export const REPORT_CONTENT_MAX_LENGTH = 1000;

export const reportLostParcelFormSchema = z.object({
  // 미래 여부는 검증하는 순간의 현재 시각과 비교한다 (`.max(new Date())` 는 스키마를 만든 시각에 고정된다).
  lostEstimatedAt: z
    .date({ error: '분실 예상 시각을 선택해 주세요.' })
    .refine((date) => date.getTime() <= Date.now(), '현재보다 이후 시각은 선택할 수 없어요.'),
  content: z
    .string()
    .trim()
    .min(1, '상세 내용을 입력해 주세요.')
    .max(
      REPORT_CONTENT_MAX_LENGTH,
      `상세 내용은 ${REPORT_CONTENT_MAX_LENGTH}자 이내로 입력해 주세요.`,
    ),
});

export type ReportLostParcelFormValues = z.infer<typeof reportLostParcelFormSchema>;
