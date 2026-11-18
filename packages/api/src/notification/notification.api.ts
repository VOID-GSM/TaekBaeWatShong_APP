import {
  type NotificationListParams,
  type NotificationListResponse,
  notificationListResponseSchema,
  type NotificationReadResponse,
  notificationReadResponseSchema,
} from '@taekbae/types';

import { api, parseResponse } from '../client';

/**
 * `GET /notification` — 내 알림 목록 한 페이지(최신순).
 * `cursor`·`size` 는 값이 있을 때만 보낸다 — 첫 페이지에 `cursor=` 를 빈 값으로 보내지 않게.
 */
export async function fetchNotifications(
  params: NotificationListParams = {},
): Promise<NotificationListResponse> {
  const query: NotificationListParams = {};
  if (params.cursor != null) query.cursor = params.cursor;
  if (params.size != null) query.size = params.size;
  const { data } = await api().get('/notification', { params: query });
  return parseResponse(notificationListResponseSchema, data);
}

/** `PATCH /notification/{id}/read` — 알림 하나를 읽음으로 바꾼다. 이미 읽은 알림이어도 성공한다. */
export async function markNotificationRead(
  notificationId: number,
): Promise<NotificationReadResponse> {
  const { data } = await api().patch(`/notification/${notificationId}/read`);
  return parseResponse(notificationReadResponseSchema, data);
}
