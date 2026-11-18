import { z } from 'zod';

/** 서버가 보내는 알림 종류. 목록 스키마는 이 값으로 막지 않고 문자열로 받는다(아래 설명). */
export const notificationTypeSchema = z.enum([
  'REGISTERED',
  'ARRIVED',
  'ZONE_ASSIGNED',
  'CLAIMED',
  'UNCLAIMED_REMINDER',
]);

/**
 * 서버 `NotificationResponse` — 택배 상태가 바뀔 때마다 쌓이는 알림 한 건.
 * 목록 응답이라 한 건만 어긋나도 전체가 실패하므로, `parcelSchema`·`adminReportSchema` 처럼 `type`·`createdAt` 은
 * 문자열로만 받는다(모르는 종류는 화면에서 기본 아이콘으로, 해석할 수 없는 시각은 원문 그대로 보여 준다).
 * `unclaimedDays` 는 방치 알림(UNCLAIMED_REMINDER)에만 온다.
 */
export const parcelNotificationSchema = z.object({
  id: z.number(),
  type: z.string(),
  title: z.string(),
  message: z.string(),
  parcelId: z.number(),
  unclaimedDays: z.number().nullish(),
  isRead: z.boolean(),
  createdAt: z.string(),
});

/**
 * `GET /notification` 응답. `unreadCount` 는 이 페이지가 아니라 안 읽은 알림 전체 개수다.
 * `nextCursor` 가 없으면(null) 마지막 페이지.
 */
export const notificationListResponseSchema = z.object({
  unreadCount: z.number(),
  notifications: z.array(parcelNotificationSchema),
  nextCursor: z.number().nullish(),
});

/** `PATCH /notification/{id}/read` 응답. 이미 읽은 알림에도 같은 형태로 온다. */
export const notificationReadResponseSchema = z.object({
  id: z.number(),
  isRead: z.boolean(),
  unreadCount: z.number(),
});

export type NotificationType = z.infer<typeof notificationTypeSchema>;
// `Notification` 이 아닌 이유: DOM 전역 `Notification` 타입·expo-notifications 와 헷갈리지 않게.
export type ParcelNotification = z.infer<typeof parcelNotificationSchema>;
export type NotificationListResponse = z.infer<typeof notificationListResponseSchema>;
export type NotificationReadResponse = z.infer<typeof notificationReadResponseSchema>;

/** `GET /notification` 쿼리. `cursor` 는 이전 응답의 `nextCursor`, `size` 는 서버 기본 20(1~100). */
export interface NotificationListParams {
  cursor?: number;
  size?: number;
}
