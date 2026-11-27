import type { ChatMessage, ChatPartner, ChatRoom } from '@taekbae/types';
import { localDateTimeToDate } from '@taekbae/utils';

import type { ChatBubbleMessage, ChatRoomSummary } from '../model/chat';
import { formatRelativeTime } from './format';

const ROLE_LABEL: Record<ChatPartner['role'], string> = {
  STUDENT: '학생',
  TEACHER: '선생님',
  ADMIN: '관리자',
};

/** 서버 `LocalDateTime` 을 기기 로컬 시각으로 읽는다. 스키마가 형식을 보장하므로 실패 시 Date 파서에 맡긴다. */
function toDate(value: string): Date {
  return localDateTimeToDate(value) ?? new Date(value);
}

export function toChatRoomSummary(room: ChatRoom, now: Date = new Date()): ChatRoomSummary {
  return {
    id: room.id,
    partnerName: room.partner.name,
    partnerLabel: room.partner.studentNumber || ROLE_LABEL[room.partner.role],
    lastMessage: room.lastMessage ?? '',
    lastMessageAt: room.lastMessageAt ? formatRelativeTime(toDate(room.lastMessageAt), now) : null,
    unreadCount: room.unreadCount,
  };
}

/** 서버 메시지(최신 먼저)를 말풍선 목록(오래된 것 → 최신)으로 바꾼다. */
export function toChatMessages(messages: readonly ChatMessage[]): ChatBubbleMessage[] {
  return messages
    .map((message) => ({
      id: message.id,
      content: message.content,
      isMine: message.isMine,
      createdAt: toDate(message.createdAt),
    }))
    .reverse();
}
