import type { AdminReport } from '@taekbae/types';

import { findChatReport } from '../use-chat-room';

const report = (overrides: Partial<AdminReport>): AdminReport => ({
  id: 1,
  reporterName: '김민준',
  studentNumber: '20614',
  alias: '겨울 패딩',
  invoiceNumber: '604122378890',
  lostEstimatedAt: '2026-07-06T15:30:00',
  progress: 'RECEIVED',
  chatRoomId: null,
  createdAt: '2026-07-06T16:00:00',
  ...overrides,
});

const room = {
  id: 7,
  partner: { id: 1, name: '김민준', role: 'STUDENT' as const, studentNumber: '20614' },
};

describe('findChatReport', () => {
  it('reportId 가 있으면 그 신고를 고른다', () => {
    const reports = [report({ id: 1, chatRoomId: 7 }), report({ id: 2 })];
    expect(findChatReport(reports, room, 2)?.id).toBe(2);
  });

  it('reportId 가 없으면 chatRoomId 로 연결된 신고', () => {
    const reports = [report({ id: 1 }), report({ id: 2, chatRoomId: 7 })];
    expect(findChatReport(reports, room)?.id).toBe(2);
  });

  it('그것도 없으면 같은 학번의 처리 완료가 아닌 가장 최근 신고', () => {
    const reports = [
      report({ id: 1, createdAt: '2026-07-05T10:00:00' }),
      report({ id: 2, createdAt: '2026-07-07T10:00:00', progress: 'DONE' }),
      report({ id: 3, createdAt: '2026-07-06T10:00:00' }),
      report({ id: 4, createdAt: '2026-07-08T10:00:00', studentNumber: '10101' }),
    ];
    expect(findChatReport(reports, room)?.id).toBe(3);
  });

  it('학번이 없는 상대(선생님)거나 방을 아직 모르면 undefined', () => {
    const reports = [report({ id: 1, studentNumber: null })];
    expect(
      findChatReport(reports, {
        ...room,
        partner: { ...room.partner, role: 'TEACHER', studentNumber: null },
      }),
    ).toBeUndefined();
    expect(findChatReport(reports, undefined)).toBeUndefined();
  });
});
