import { Typography } from '@/shared/ui';

export interface ChatDateDividerProps {
  /** `2026년 7월 6일` */
  label: string;
}

/** 대화 중 날짜가 바뀌는 지점의 날짜 표시 (시안 C11). */
export function ChatDateDivider({ label }: ChatDateDividerProps) {
  return (
    <Typography
      variant="bodyMStrong"
      color="textTertiary"
      align="center"
      accessibilityRole="header"
    >
      {label}
    </Typography>
  );
}
