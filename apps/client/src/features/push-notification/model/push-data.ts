import { z } from 'zod';

/**
 * 서버가 푸시 `data` 에 넣어 보내는 값 (SERVER #33). 알림 목록의 알림과 같은 id 를 쓴다.
 * 다른 곳(Expo 대시보드 테스트 발송 등)에서 온 알림은 이 형식이 아닐 수 있어 검증한다.
 */
const pushDataSchema = z.object({
  notificationId: z.number().int().positive(),
  type: z.string(),
  parcelId: z.number().int().nullish(),
});

export type PushNotificationData = z.infer<typeof pushDataSchema>;

/** 서버가 보낸 택배 알림이 아니면 null. */
export function parsePushNotificationData(data: unknown): PushNotificationData | null {
  const result = pushDataSchema.safeParse(data);
  return result.success ? result.data : null;
}
