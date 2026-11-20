import { notificationKeys, useMarkNotificationReadMutation } from '@taekbae/api';
import { useQueryClient } from '@tanstack/react-query';
import {
  addNotificationReceivedListener,
  clearLastNotificationResponse,
  DEFAULT_ACTION_IDENTIFIER,
  setNotificationHandler,
  useLastNotificationResponse,
} from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { parsePushNotificationData } from './push-data';

let isForegroundDisplayConfigured = false;

/**
 * 앱을 쓰는 중에 온 알림도 알림창·배너로 띄운다. 설정하지 않으면 Expo 는 포그라운드 알림을 표시하지 않는다.
 * 앱 아이콘 배지 숫자는 서버가 보내지 않아 건드리지 않는다.
 */
export function configureForegroundNotifications(): void {
  // 웹은 푸시를 받지 않는다(토큰도 등록하지 않음).
  if (isForegroundDisplayConfigured || Platform.OS === 'web') return;
  setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  isForegroundDisplayConfigured = true;
}

/**
 * 처리한 알림 탭. 화면이 다시 마운트돼도(로그아웃 뒤 재로그인 등) 같은 탭을 두 번 처리하지 않게 모듈에 둔다.
 * `clearLastNotificationResponse` 로도 지우지만, 훅이 지우기 전 값으로 한 번 더 렌더할 수 있어 같이 막는다.
 */
const handledResponses = new Set<string>();

function useNativePushNotificationHandling(onOpen: () => void): void {
  const queryClient = useQueryClient();
  const { mutate: markRead } = useMarkNotificationReadMutation();
  const lastResponse = useLastNotificationResponse();

  // onOpen 이 렌더마다 바뀌어도 이미 처리한 탭을 다시 보지 않게 최신 값만 ref 로 읽는다.
  const onOpenRef = useRef(onOpen);
  useEffect(() => {
    onOpenRef.current = onOpen;
  }, [onOpen]);

  useEffect(() => {
    const subscription = addNotificationReceivedListener((notification) => {
      if (parsePushNotificationData(notification.request.content.data) === null) return;
      void queryClient.invalidateQueries({ queryKey: notificationKeys.list() });
    });
    return () => subscription.remove();
  }, [queryClient]);

  useEffect(() => {
    if (!lastResponse || lastResponse.actionIdentifier !== DEFAULT_ACTION_IDENTIFIER) return;
    const id = lastResponse.notification.request.identifier;
    if (handledResponses.has(id)) return;
    handledResponses.add(id);
    clearLastNotificationResponse();

    const data = parsePushNotificationData(lastResponse.notification.request.content.data);
    if (data === null) return;

    onOpenRef.current();
    // 앱이 백그라운드였으면 받은 알림 이벤트가 오지 않아 목록이 옛날 것이다. 읽음 처리가 끝난 뒤 다시 받는다 —
    // 먼저 다시 받으면 읽음 요청이 그 조회를 취소한다(useMarkNotificationReadMutation 의 onMutate).
    // 다른 계정이 받은 알림이면 읽음 요청이 실패하는데, 알리지 않는다(알림 화면에서 누를 때와 같음).
    markRead(data.notificationId, {
      onSettled: () => void queryClient.invalidateQueries({ queryKey: notificationKeys.list() }),
    });
  }, [lastResponse, markRead, queryClient]);
}

/**
 * 로그인한 화면에서 푸시 알림을 처리한다.
 * - 알림을 받으면 알림 목록(탭 빨간 점 포함)을 다시 받는다.
 * - 알림을 누르면(앱이 꺼져 있다가 알림으로 켜진 경우 포함) `onOpen` 을 부르고 그 알림을 읽음 처리한다.
 *
 * 로그인하지 않은 상태에서 누른 알림은 로그인한 뒤 이 훅이 마운트될 때 처리된다.
 * 웹은 푸시를 받지 않고, expo-notifications 의 마지막 응답 API(`getLastNotificationResponse` 등)가 웹에서
 * `UnavailabilityError` 를 던져 아무것도 하지 않는다. `Platform.OS` 는 실행 중에 바뀌지 않아 훅 규칙을 지킨다.
 */
export const usePushNotificationHandling: (onOpen: () => void) => void =
  Platform.OS === 'web' ? () => {} : useNativePushNotificationHandling;
