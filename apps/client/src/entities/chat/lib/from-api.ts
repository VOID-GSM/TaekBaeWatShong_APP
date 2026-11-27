import type { ChatMessage, ChatPartner, ChatRoom } from '@taekbae/types';
import { localDateTimeToDate } from '@taekbae/utils';

import type { ChatBubbleMessage } from '../model/chat-message';
import type { ChatRoomSummary } from '../model/chat-room';
import { formatRelativeTime } from './format';

/** 관리자(ADMIN)는 개인 이름 대신 부서 이름으로 보여 준다(시안 C11). */
export const STAFF_NAME = '학생생활안전부';

const ROLE_LABEL: Record<ChatPartner['role'], string> = {
  STUDENT: '학생',
  TEACHER: '선생님',
  ADMIN: '',
};

/** 서버 `LocalDateTime` 을 기기 로컬 시각으로 읽는다. 스키마가 형식을 보장하므로 실패 시 Date 파서에 맡긴다. */
function toDate(value: string): Date {
  return localDateTimeToDate(value) ?? new Date(value);
}

/** 채팅 상대를 화면에 보일 이름·꼬리표로 바꾼다. */
export function toPartnerDisplay(partner: ChatPartner): {
  isStaff: boolean;
  name: string;
  label: string;
} {
  if (partner.role === 'ADMIN') return { isStaff: true, name: STAFF_NAME, label: '' };
  return {
    isStaff: false,
    name: partner.name,
    label: partner.studentNumber || ROLE_LABEL[partner.role],
  };
}

export function toChatRoomSummary(room: ChatRoom, now: Date = new Date()): ChatRoomSummary {
  const partner = toPartnerDisplay(room.partner);
  return {
    id: room.id,
    isStaff: partner.isStaff,
    partnerName: partner.name,
    partnerLabel: partner.label,
    lastMessage: room.lastMessage ?? '',
    lastMessageAt: room.lastMessageAt ? formatRelativeTime(toDate(room.lastMessageAt), now) : null,
    unreadCount: room.unreadCount,
  };
}

/** 서버 메시지(최신 먼저)를 말풍선 목록(오래된 것 → 최신)으로 바꾼다. 시각은 서버 `LocalDateTime` 을 기기 로컬로 읽는다. */
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
