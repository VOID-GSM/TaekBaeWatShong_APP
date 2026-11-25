import type { ChatRoom } from '@taekbae/types';

/**
 * 목록 섹션을 나눈다. 안 읽은 메시지가 있는 방은 "채팅 요청", 나머지는 "진행 중".
 * 서버가 내려준 순서는 그대로 둔다.
 */
export function splitChatRooms(rooms: readonly ChatRoom[]): {
  requested: ChatRoom[];
  active: ChatRoom[];
} {
  const requested: ChatRoom[] = [];
  const active: ChatRoom[] = [];
  for (const room of rooms) {
    (room.unreadCount > 0 ? requested : active).push(room);
  }
  return { requested, active };
}
