import { parsePushNotificationData } from '../push-data';

describe('parsePushNotificationData', () => {
  it('서버가 보낸 택배 알림 data 를 읽는다', () => {
    expect(parsePushNotificationData({ notificationId: 7, type: 'ARRIVED', parcelId: 3 })).toEqual({
      notificationId: 7,
      type: 'ARRIVED',
      parcelId: 3,
    });
  });

  it('택배가 없는 알림(parcelId null)도 읽는다', () => {
    expect(
      parsePushNotificationData({ notificationId: 7, type: 'UNCLAIMED_REMINDER', parcelId: null }),
    ).toEqual({ notificationId: 7, type: 'UNCLAIMED_REMINDER', parcelId: null });
  });

  it.each([
    ['data 없음', undefined],
    ['빈 객체', {}],
    ['notificationId 가 문자열', { notificationId: '7', type: 'ARRIVED' }],
    ['notificationId 가 0', { notificationId: 0, type: 'ARRIVED' }],
    ['type 없음', { notificationId: 7 }],
  ])('택배 알림 형식이 아니면 null (%s)', (_, data) => {
    expect(parsePushNotificationData(data)).toBeNull();
  });
});
