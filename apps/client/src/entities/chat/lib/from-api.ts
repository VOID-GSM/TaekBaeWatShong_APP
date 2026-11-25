import type { ChatMessage } from '@taekbae/types';
import { localDateTimeToDate } from '@taekbae/utils';

import type { ChatBubbleMessage } from '../model/chat-message';

/** 서버 메시지(최신 먼저)를 말풍선 목록(오래된 것 → 최신)으로 바꾼다. 시각은 서버 `LocalDateTime` 을 기기 로컬로 읽는다. */
export function toChatMessages(messages: readonly ChatMessage[]): ChatBubbleMessage[] {
  return messages
    .map((message) => ({
      id: message.id,
      content: message.content,
      isMine: message.isMine,
      createdAt: localDateTimeToDate(message.createdAt) ?? new Date(message.createdAt),
    }))
    .reverse();
}
