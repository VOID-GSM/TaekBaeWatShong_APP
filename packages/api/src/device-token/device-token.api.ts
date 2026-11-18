import {
  type DeviceTokenRegisterRequest,
  type DeviceTokenResponse,
  deviceTokenResponseSchema,
} from '@taekbae/types';

import { api, ApiError, parseResponse } from '../client';

/**
 * `POST /notification/token` — 이 기기의 푸시 토큰을 로그인한 사용자에게 등록한다.
 * 이미 등록된 토큰이면 서버가 소유자를 현재 사용자로 바꾼다 — 앱을 켤 때마다 불러도 된다.
 */
export async function registerDeviceToken(
  request: DeviceTokenRegisterRequest,
): Promise<DeviceTokenResponse> {
  const { data } = await api().post('/notification/token', request);
  return parseResponse(deviceTokenResponseSchema, data);
}

/**
 * `DELETE /notification/token` — 로그아웃할 때 이 기기의 푸시 토큰을 지운다. 성공하면 서버는 항상 204다.
 *
 * axios 인스턴스를 쓰지 않는다. 인스턴스의 요청 인터셉터는 만료된 세션이면 요청을 막고 로그아웃을 부르는데,
 * 이 요청은 바로 그 로그아웃 중에, 만료된 액세스 토큰으로 보내야 하기 때문이다(서버가 이 API 만 만료 토큰을 받는다).
 */
export async function deleteDeviceToken(
  baseUrl: string,
  accessToken: string,
  deviceToken: string,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch(`${baseUrl}/notification/token`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceToken }),
    signal,
  });

  if (!response.ok) {
    throw new ApiError(`푸시 토큰을 지우지 못했습니다. (HTTP ${response.status})`, response.status);
  }
}
