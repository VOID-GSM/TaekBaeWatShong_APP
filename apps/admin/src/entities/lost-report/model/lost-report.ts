/** 신고 처리 상태. 채팅을 요청하면 `chatRequested` 로 바뀐다. */
export type LostReportStatus = 'new' | 'chatRequested';

export interface LostReportReporter {
  name: string;
  role: 'STUDENT' | 'TEACHER';
  /** 학생만 있다. */
  studentNumber?: string;
}

/** 학생·선생님이 접수한 택배 분실 신고. 백엔드 API 가 생기면 `@taekbae/types` 스키마로 옮긴다. */
export interface LostReport {
  id: number;
  status: LostReportStatus;
  reporter: LostReportReporter;
  productName: string;
  carrier: string;
  trackingNumber: string;
  /** 분실 예상 시각 (ISO 8601) */
  lostAt: string;
  content: string;
}
