import type { ChatRoom } from '@taekbae/types';

import { splitChatRooms } from '../split-rooms';

const room = (id: number, unreadCount: number): ChatRoom => ({
  id,
  type: 'DRIVER',
  partner: { id, name: `학생${id}`, role: 'STUDENT', studentNumber: null },
  lastMessage: null,
  lastMessageAt: null,
  unreadCount,
  createdAt: '2026-07-06T15:00:00',
});

describe('splitChatRooms', () => {
  it('안 읽은 메시지가 있는 방은 요청, 나머지는 진행 중으로 나누고 순서는 유지한다', () => {
    const { requested, active } = splitChatRooms([room(1, 0), room(2, 3), room(3, 0), room(4, 1)]);
    expect(requested.map((item) => item.id)).toEqual([2, 4]);
    expect(active.map((item) => item.id)).toEqual([1, 3]);
  });
});
