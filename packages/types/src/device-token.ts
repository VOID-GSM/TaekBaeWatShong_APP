import { z } from 'zod';

export const devicePlatformSchema = z.enum(['ANDROID', 'IOS', 'WEB']);
export type DevicePlatform = z.infer<typeof devicePlatformSchema>;

/** `POST /notification/token` 요청. `deviceToken` 은 Expo 푸시 토큰(`ExponentPushToken[...]`)이다. */
export interface DeviceTokenRegisterRequest {
  deviceToken: string;
  platform: DevicePlatform;
}

/** 서버 `DeviceTokenResponse`. 앱은 등록 성공 여부만 보므로 id 만 엄격하게 본다. */
export const deviceTokenResponseSchema = z.object({
  id: z.number(),
  platform: z.string(),
  createdAt: z.string().nullish(),
});

export type DeviceTokenResponse = z.infer<typeof deviceTokenResponseSchema>;
