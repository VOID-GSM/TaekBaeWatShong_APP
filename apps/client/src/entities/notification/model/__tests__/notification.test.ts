import { formatNotificationTime, getNotificationKind } from '../notification';

describe('getNotificationKind', () => {
  it.each([
    ['REGISTERED', 'registered'],
    ['ARRIVED', 'arrived'],
    ['ZONE_ASSIGNED', 'zoneAssigned'],
    ['CLAIMED', 'claimed'],
    ['UNCLAIMED_REMINDER', 'unclaimedReminder'],
  ])('%s → %s', (type, kind) => {
    expect(getNotificationKind(type)).toBe(kind);
  });

  it('모르는 종류는 unknown — 프로토타입 키도 마찬가지', () => {
    expect(getNotificationKind('PARCEL_LOST')).toBe('unknown');
    expect(getNotificationKind('')).toBe('unknown');
    expect(getNotificationKind('toString')).toBe('unknown');
  });
});

describe('formatNotificationTime', () => {
  // 기기 로컬 시각 기준. 2026-07-06 15:30:00
  const now = new Date(2026, 6, 6, 15, 30, 0);

  it('1분이 안 됐으면 방금 전', () => {
    expect(formatNotificationTime('2026-07-06T15:29:01', now)).toBe('방금 전');
    expect(formatNotificationTime('2026-07-06T15:30:00', now)).toBe('방금 전');
  });

  it('기기 시계보다 미래 시각도 방금 전', () => {
    expect(formatNotificationTime('2026-07-06T15:32:00', now)).toBe('방금 전');
  });

  it('1시간이 안 됐으면 N분 전', () => {
    expect(formatNotificationTime('2026-07-06T15:29:00', now)).toBe('1분 전');
    expect(formatNotificationTime('2026-07-06T14:30:01', now)).toBe('59분 전');
  });

  it('오늘이면 N시간 전', () => {
    expect(formatNotificationTime('2026-07-06T14:30:00', now)).toBe('1시간 전');
    expect(formatNotificationTime('2026-07-06T00:00:00', now)).toBe('15시간 전');
  });

  it('자정 직후에 본 어제 밤 알림은 분 단위가 먼저다', () => {
    const justAfterMidnight = new Date(2026, 6, 7, 0, 10, 0);
    expect(formatNotificationTime('2026-07-06T23:50:00', justAfterMidnight)).toBe('20분 전');
    expect(formatNotificationTime('2026-07-06T22:00:00', justAfterMidnight)).toBe('어제');
  });

  it('어제면 어제', () => {
    expect(formatNotificationTime('2026-07-05T23:59:59', now)).toBe('어제');
    expect(formatNotificationTime('2026-07-05T00:00:00', now)).toBe('어제');
  });

  it('그 전이고 올해면 M월 D일', () => {
    expect(formatNotificationTime('2026-07-04T23:59:59', now)).toBe('7월 4일');
    expect(formatNotificationTime('2026-01-01T00:00:00', now)).toBe('1월 1일');
  });

  it('작년 이전이면 YYYY. M. D.', () => {
    expect(formatNotificationTime('2025-12-31T23:59:59', now)).toBe('2025. 12. 31.');
  });

  it('밀리초가 붙은 값도 해석한다', () => {
    expect(formatNotificationTime('2026-07-06T15:00:00.123', now)).toBe('30분 전');
  });

  it('해석할 수 없으면 원문 그대로', () => {
    expect(formatNotificationTime('어제 오후', now)).toBe('어제 오후');
    expect(formatNotificationTime('', now)).toBe('');
  });
});
