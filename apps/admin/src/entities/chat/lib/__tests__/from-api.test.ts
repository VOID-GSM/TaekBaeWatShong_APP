import type { ChatMessage, ChatRoom } from '@taekbae/types';

import { toChatMessages, toChatRoomSummary } from '../from-api';

const room: ChatRoom = {
  id: 7,
  type: 'DRIVER',
  partner: { id: 1, name: '김민준', role: 'STUDENT', studentNumber: '20614' },
  lastMessage: '겨울 패딩 택배가 C구역에 안 보여요',
  lastMessageAt: '2026-07-06T15:18:00',
  unreadCount: 2,
  createdAt: '2026-07-06T15:00:00',
};

describe('toChatRoomSummary', () => {
  const now = new Date(2026, 6, 6, 15, 30);

  it('서버 시각을 기기 로컬로 읽어 상대 시각을 만든다', () => {
    expect(toChatRoomSummary(room, now)).toEqual({
      id: 7,
      partnerName: '김민준',
      partnerLabel: '20614',
      lastMessage: '겨울 패딩 택배가 C구역에 안 보여요',
      lastMessageAt: '12분 전',
      unreadCount: 2,
    });
  });

  it('학번이 없으면 역할, 메시지가 없으면 빈 문자열·null', () => {
    const summary = toChatRoomSummary(
      {
        ...room,
        partner: { id: 3, name: '이선생님', role: 'TEACHER', studentNumber: null },
        lastMessage: null,
        lastMessageAt: null,
      },
      now,
    );
    expect(summary.partnerLabel).toBe('선생님');
    expect(summary.lastMessage).toBe('');
    expect(summary.lastMessageAt).toBeNull();
  });
});

describe('toChatMessages', () => {
  const message = (id: number, createdAt: string, isMine: boolean): ChatMessage => ({
    id,
    roomId: 7,
    senderId: isMine ? 99 : 1,
    senderName: isMine ? '관리자' : '김민준',
    content: `m${id}`,
    isMine,
    isRead: true,
    createdAt,
  });

  it('최신 먼저 온 메시지를 오래된 순으로 뒤집고 시각을 Date 로 바꾼다', () => {
    const result = toChatMessages([
      message(2, '2026-07-06T15:31:00.123456', true),
      message(1, '2026-07-06T15:30:00', false),
    ]);
    expect(result).toEqual([
      { id: 1, content: 'm1', isMine: false, createdAt: new Date(2026, 6, 6, 15, 30, 0) },
      { id: 2, content: 'm2', isMine: true, createdAt: new Date(2026, 6, 6, 15, 31, 0) },
    ]);
  });
});
