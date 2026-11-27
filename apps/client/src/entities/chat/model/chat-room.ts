/** 채팅 목록 카드 한 장. 서버 `ChatRoom` 을 화면에 보일 문자열로 바꾼 것. */
export interface ChatRoomSummary {
  id: number;
  /** 관리자(ADMIN)와의 방은 학생생활안전부로 보여 준다. */
  isStaff: boolean;
  partnerName: string;
  /** 학번(`20614`), 학번이 없으면 역할(`선생님`). 학생생활안전부는 빈 문자열. */
  partnerLabel: string;
  /** 메시지가 없으면 빈 문자열 */
  lastMessage: string;
  /** `방금 전` · `12분 전` · `3시간 전` · `어제` · `07.03`. 메시지가 없으면 `null`. */
  lastMessageAt: string | null;
  unreadCount: number;
}
