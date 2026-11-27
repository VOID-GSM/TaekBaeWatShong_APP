import { toChatMessages } from '../from-api';

describe('toChatMessages', () => {
  it('최신 먼저 온 메시지를 오래된 순으로 뒤집고 서버 시각을 기기 로컬로 읽는다', () => {
    const base = { roomId: 1, senderId: 1, senderName: '관리자', isRead: true };
    expect(
      toChatMessages([
        { ...base, id: 2, content: '네', isMine: true, createdAt: '2026-07-06T15:31:00' },
        { ...base, id: 1, content: '안녕', isMine: false, createdAt: '2026-07-06T15:30:00' },
      ]),
    ).toEqual([
      { id: 1, content: '안녕', isMine: false, createdAt: new Date(2026, 6, 6, 15, 30) },
      { id: 2, content: '네', isMine: true, createdAt: new Date(2026, 6, 6, 15, 31) },
    ]);
  });
});
