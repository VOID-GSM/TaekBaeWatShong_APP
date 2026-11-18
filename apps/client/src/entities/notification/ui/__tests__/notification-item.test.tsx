import type { ParcelNotification } from '@taekbae/types';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { NotificationItem } from '../notification-item';

// 캐시가 없는 첫 실행에서는 첫 렌더가 RN 모듈을 지연 로드하느라 기본 5초를 넘길 수 있다.
jest.setTimeout(10_000);

const now = new Date(2026, 10, 18, 15, 0, 0);

const arrived: ParcelNotification = {
  id: 1,
  type: 'ARRIVED',
  title: '택배가 도착했어요',
  message: 'CJ대한통운 택배가 B구역에 도착했어요',
  parcelId: 10,
  unclaimedDays: null,
  isRead: false,
  createdAt: '2026-11-18T14:55:00',
};

describe('NotificationItem', () => {
  it('제목·내용·시각을 보여주고, 안 읽은 알림은 스크린 리더에 안 읽음을 먼저 읽어 준다', async () => {
    await render(<NotificationItem notification={arrived} now={now} onPress={() => {}} />);

    expect(screen.getByText('택배가 도착했어요')).toBeOnTheScreen();
    expect(screen.getByText('CJ대한통운 택배가 B구역에 도착했어요')).toBeOnTheScreen();
    expect(screen.getByText('5분 전')).toBeOnTheScreen();
    expect(
      screen.getByRole('button', {
        name: '안 읽음, 택배가 도착했어요. CJ대한통운 택배가 B구역에 도착했어요. 5분 전',
      }),
    ).toBeOnTheScreen();
  });

  it('읽은 알림은 안 읽음 없이 읽어 준다', async () => {
    await render(
      <NotificationItem notification={{ ...arrived, isRead: true }} now={now} onPress={() => {}} />,
    );

    expect(
      screen.getByRole('button', {
        name: '택배가 도착했어요. CJ대한통운 택배가 B구역에 도착했어요. 5분 전',
      }),
    ).toBeOnTheScreen();
  });

  it('누르면 알림을 넘겨 onPress 를 부른다', async () => {
    const onPress = jest.fn();
    await render(<NotificationItem notification={arrived} now={now} onPress={onPress} />);

    await fireEvent.press(screen.getByRole('button'));

    expect(onPress).toHaveBeenCalledWith(arrived);
  });

  it('onPress 가 없으면 버튼으로 읽히지 않는다', async () => {
    await render(<NotificationItem notification={arrived} now={now} />);

    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('택배가 도착했어요')).toBeOnTheScreen();
  });

  it('방치 알림은 미수령 일수를 보여준다', async () => {
    await render(
      <NotificationItem
        notification={{ ...arrived, type: 'UNCLAIMED_REMINDER', unclaimedDays: 3 }}
        now={now}
      />,
    );

    expect(screen.getByText('미수령 3일')).toBeOnTheScreen();
  });

  it('모르는 종류의 알림도 그대로 보여준다', async () => {
    await render(
      <NotificationItem notification={{ ...arrived, type: 'SOMETHING_NEW' }} now={now} />,
    );

    expect(screen.getByText('택배가 도착했어요')).toBeOnTheScreen();
    expect(screen.queryByText(/미수령/)).toBeNull();
  });
});
