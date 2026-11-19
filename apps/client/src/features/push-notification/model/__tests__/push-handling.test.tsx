import { notificationKeys } from '@taekbae/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import type { PropsWithChildren } from 'react';
import { Platform } from 'react-native';

import { configureForegroundNotifications, usePushNotificationHandling } from '../push-handling';

// 읽음 mutation 은 @taekbae/api 안에서 요청 함수를 직접 부르므로 훅을 통째로 바꾼다.
// 요청 성공·실패와 관계없이 onSettled 를 부르는 react-query 동작을 흉내 낸다.
const mockMarkRead = jest.fn<void, [number, { onSettled?: () => void }?]>();
jest.mock('@taekbae/api', () => ({
  ...jest.requireActual('@taekbae/api'),
  useMarkNotificationReadMutation: () => ({ mutate: mockMarkRead }),
}));

let mockLastResponse: Notifications.NotificationResponse | null | undefined;
let mockReceivedListener: ((notification: Notifications.Notification) => void) | null = null;
const mockRemove = jest.fn();

jest.mock('expo-notifications', () => ({
  DEFAULT_ACTION_IDENTIFIER: 'expo.modules.notifications.actions.DEFAULT',
  setNotificationHandler: jest.fn(),
  clearLastNotificationResponse: jest.fn(),
  useLastNotificationResponse: () => mockLastResponse,
  addNotificationReceivedListener: jest.fn((listener) => {
    mockReceivedListener = listener;
    return { remove: mockRemove };
  }),
}));

const DEFAULT_ACTION = 'expo.modules.notifications.actions.DEFAULT';

function notification(identifier: string, data: unknown): Notifications.Notification {
  return {
    date: 0,
    request: { identifier, content: { data }, trigger: null },
  } as unknown as Notifications.Notification;
}

function response(
  identifier: string,
  data: unknown,
  actionIdentifier = DEFAULT_ACTION,
): Notifications.NotificationResponse {
  return { actionIdentifier, notification: notification(identifier, data) };
}

const serverData = { notificationId: 7, type: 'ARRIVED', parcelId: 3 };

async function setup() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidate = jest.spyOn(queryClient, 'invalidateQueries');
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const onOpen = jest.fn();
  const view = await renderHook(() => usePushNotificationHandling(onOpen), { wrapper });
  return { invalidate, onOpen, view };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockLastResponse = null;
  mockReceivedListener = null;
  mockMarkRead.mockImplementation((_, options) => options?.onSettled?.());
});

describe('usePushNotificationHandling — 받은 알림', () => {
  it('택배 알림을 받으면 알림 목록을 다시 받는다', async () => {
    const { invalidate } = await setup();

    mockReceivedListener?.(notification('a', serverData));

    expect(invalidate).toHaveBeenCalledWith({ queryKey: notificationKeys.list() });
  });

  it('택배 알림 형식이 아니면 목록을 다시 받지 않는다', async () => {
    const { invalidate } = await setup();

    mockReceivedListener?.(notification('a', { hello: 'world' }));

    expect(invalidate).not.toHaveBeenCalled();
  });

  it('언마운트하면 리스너를 해제한다', async () => {
    const { view } = await setup();

    await act(async () => view.unmount());

    expect(mockRemove).toHaveBeenCalled();
  });
});

describe('usePushNotificationHandling — 누른 알림', () => {
  it('알림 화면을 열고 읽음 처리한 뒤 목록을 다시 받는다', async () => {
    mockLastResponse = response('tap-1', serverData);
    const { invalidate, onOpen } = await setup();

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(Notifications.clearLastNotificationResponse).toHaveBeenCalled();
    await waitFor(() => expect(mockMarkRead).toHaveBeenCalledWith(7, expect.anything()));
    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({ queryKey: notificationKeys.list() }),
    );
  });

  it('읽음 처리가 끝나기 전에는 목록을 다시 받지 않는다', async () => {
    // 먼저 다시 받으면 읽음 요청의 onMutate 가 그 조회를 취소한다.
    let settle: (() => void) | undefined;
    mockMarkRead.mockImplementation((_, options) => {
      settle = options?.onSettled;
    });
    mockLastResponse = response('tap-2', serverData);
    const { invalidate, onOpen } = await setup();

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(invalidate).not.toHaveBeenCalled();

    settle?.();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: notificationKeys.list() });
  });

  it('같은 알림 탭은 다시 마운트돼도 한 번만 처리한다', async () => {
    mockLastResponse = response('tap-3', serverData);
    const first = await setup();
    await act(async () => first.view.unmount());
    const second = await setup();

    expect(first.onOpen).toHaveBeenCalledTimes(1);
    expect(second.onOpen).not.toHaveBeenCalled();
  });

  it('알림 탭이 아닌 동작(액션 버튼 등)은 처리하지 않는다', async () => {
    mockLastResponse = response('tap-4', serverData, 'other-action');
    const { onOpen } = await setup();

    expect(onOpen).not.toHaveBeenCalled();
    expect(mockMarkRead).not.toHaveBeenCalled();
  });

  it('택배 알림 형식이 아니면 화면을 열지 않는다', async () => {
    mockLastResponse = response('tap-5', { url: 'https://example.com' });
    const { onOpen } = await setup();

    expect(onOpen).not.toHaveBeenCalled();
    expect(mockMarkRead).not.toHaveBeenCalled();
  });

  it('누른 알림이 없으면 아무것도 하지 않는다', async () => {
    mockLastResponse = undefined;
    const { onOpen } = await setup();

    expect(onOpen).not.toHaveBeenCalled();
  });
});

describe('configureForegroundNotifications', () => {
  it('앱을 쓰는 중에 온 알림도 배너·알림창으로 띄우고 배지는 건드리지 않는다', async () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    configureForegroundNotifications();
    configureForegroundNotifications();

    expect(Notifications.setNotificationHandler).toHaveBeenCalledTimes(1);
    const handler = jest.mocked(Notifications.setNotificationHandler).mock.calls[0]?.[0];
    await expect(handler?.handleNotification(notification('a', serverData))).resolves.toEqual({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    });
  });
});
