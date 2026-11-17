import { localDateTimeToDate, parseDateTimeInput } from '@taekbae/utils';
import { z } from 'zod';

export const REPORT_CONTENT_MAX_LENGTH = 1000;

export const reportLostParcelFormSchema = z.object({
  lostEstimatedAt: z.string().superRefine((value, ctx) => {
    const localDateTime = parseDateTimeInput(value);
    if (localDateTime === null) {
      ctx.addIssue({
        code: 'custom',
        message: '분실 예상 시각을 선택해 주세요.',
      });
      return;
    }

    const date = localDateTimeToDate(localDateTime);
    if (date !== null && date.getTime() > Date.now()) {
      ctx.addIssue({ code: 'custom', message: '현재보다 이후 시각은 선택할 수 없어요.' });
    }
  }),
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
