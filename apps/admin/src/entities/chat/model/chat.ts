/** 채팅 목록 카드 한 장. 서버 `ChatRoom` 을 화면에 보일 문자열로 바꾼 것. */
export interface ChatRoomSummary {
  id: number;
  partnerName: string;
  /** 학번(`20614`), 학번이 없으면 역할(`선생님`) */
  partnerLabel: string;
  /** 메시지가 없으면 빈 문자열 */
  lastMessage: string;
  /** `방금 전` · `12분 전` · `3시간 전` · `어제` · `07.03`. 메시지가 없으면 `null`. */
  lastMessageAt: string | null;
  unreadCount: number;
}

/** 채팅방 말풍선 하나. `isMine` 은 관리자가 보낸 메시지. */
export interface ChatBubbleMessage {
  id: number;
  content: string;
  isMine: boolean;
  /** 기기 로컬 시각 */
  createdAt: Date;
}
