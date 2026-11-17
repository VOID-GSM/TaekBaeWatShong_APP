/**
 * 신고 처리 상태. 채팅을 요청하면 `CHAT_REQUESTED` 로 바뀐다.
 * API 응답을 그대로 쓰도록 서버 enum 표기(`role` 과 같은 대문자 스네이크)를 따른다.
 */
export type LostReportStatus = 'NEW' | 'CHAT_REQUESTED';

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
