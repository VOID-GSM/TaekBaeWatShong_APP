import type { AdminReport } from '@taekbae/types';

/** 관리자가 보는 분실 신고 한 건 — 서버 `GET /report` 응답 그대로. */
export type LostReport = AdminReport;

/**
 * 카드에 보여 줄 처리 상태. 서버는 `progress`(접수·처리 중·완료)와 채팅방 유무를 따로 내려주므로 둘을 합쳐 정한다.
 * - new: 아직 채팅을 시작하지 않은 신고
 * - chatRequested: 채팅방이 만들어진 신고
 * - done: 처리 완료 (시안에 없는 상태 — 디자이너 확인 필요)
 */
export type LostReportState = 'new' | 'chatRequested' | 'done';

export function getLostReportState(
  report: Pick<LostReport, 'progress' | 'chatRoomId'>,
): LostReportState {
  if (report.progress === 'DONE') return 'done';
  return report.chatRoomId != null ? 'chatRequested' : 'new';
}
