/** 채팅 말풍선 하나. `isMine` 은 이 앱 사용자(학생·선생님)가 보낸 메시지. */
export interface ChatBubbleMessage {
  id: number;
  content: string;
  isMine: boolean;
  /** 기기 로컬 시각 */
  createdAt: Date;
}
