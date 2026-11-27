import type { ChatBubbleMessage } from '../model/chat-message';

export interface ChatMessageSection {
  /** `2026년 7월 6일` — 기기 시간대 기준 */
  date: string;
  messages: ChatBubbleMessage[];
}

function formatChatDate(date: Date): string {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

/** 오래된 순 메시지를 날짜가 바뀌는 지점마다 묶는다. 순서는 그대로 둔다. */
export function groupMessagesByDate(messages: readonly ChatBubbleMessage[]): ChatMessageSection[] {
  const sections: ChatMessageSection[] = [];
  for (const message of messages) {
    const date = formatChatDate(message.createdAt);
    const last = sections.at(-1);
    if (last?.date === date) {
      last.messages.push(message);
    } else {
      sections.push({ date, messages: [message] });
    }
  }
  return sections;
}
