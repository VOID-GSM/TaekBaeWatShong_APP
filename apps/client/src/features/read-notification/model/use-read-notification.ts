import { useMarkNotificationReadMutation } from '@taekbae/api';
import type { ParcelNotification } from '@taekbae/types';
import { useCallback } from 'react';

/**
 * 알림을 읽음 처리하는 함수를 돌려준다. 이미 읽은 알림이면 요청하지 않는다.
 * 실패는 알리지 않는다 — 다음 조회 때 다시 안 읽음으로 보인다.
 */
export function useReadNotification(): (notification: ParcelNotification) => void {
  const { mutate } = useMarkNotificationReadMutation();
  return useCallback(
    (notification: ParcelNotification) => {
      if (!notification.isRead) mutate(notification.id);
    },
    [mutate],
  );
}
