import { deleteDeviceToken, registerDeviceToken, resolveApiBaseUrl } from '@taekbae/api';
import type { DevicePlatform } from '@taekbae/types';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import {
  AndroidImportance,
  getExpoPushTokenAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  setNotificationChannelAsync,
} from 'expo-notifications';
import { Platform } from 'react-native';

import {
  clearStoredPushToken,
  readStoredPushToken,
  storePushToken,
} from '../api/push-token-storage';

/** Android 알림 채널. 서버가 `channelId` 를 보내지 않으면 Expo 는 이 이름(`default`)의 채널로 띄운다. */
export const ANDROID_CHANNEL_ID = 'default';

/** 로그아웃이 이 요청 때문에 오래 걸리지 않게 끊는 시간 */
export const UNREGISTER_TIMEOUT_MS = 5_000;

export type PushTokenRegistration =
  { status: 'registered'; token: string } | { status: 'unsupported' } | { status: 'denied' };

function devicePlatform(): DevicePlatform | null {
  if (Platform.OS === 'ios') return 'IOS';
  if (Platform.OS === 'android') return 'ANDROID';
  return null;
}

function easProjectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  // Android 13 이상은 채널이 하나라도 있어야 알림 권한 창이 뜬다.
  await setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: '택배 알림',
    importance: AndroidImportance.HIGH,
  });
}

async function hasPermission(): Promise<boolean> {
  const current = await getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const requested = await requestPermissionsAsync();
  return requested.granted;
}

/**
 * 진행 중인 등록. 등록하는 사이(권한 창을 띄워 둔 동안 등) 로그아웃하면, 해제가 이 등록이 끝나기를 기다렸다가 지운다.
 * 기다리지 않으면 해제가 먼저 끝나고 그 뒤 등록이 완료돼, 로그아웃한 기기가 이전 계정으로 등록된 채 남는다.
 */
let pendingRegistration: Promise<unknown> | null = null;

async function register(): Promise<PushTokenRegistration> {
  const platform = devicePlatform();
  if (platform === null || !Device.isDevice) return { status: 'unsupported' };

  await ensureAndroidChannel();
  if (!(await hasPermission())) return { status: 'denied' };

  const { data: token } = await getExpoPushTokenAsync({ projectId: easProjectId() });
  // 서버에 보내기 전에 저장한다 — 등록 요청이 서버에 닿았는지 모르는 채 실패해도 로그아웃 때 지울 수 있다.
  await storePushToken(token);
  await registerDeviceToken({ deviceToken: token, platform });
  return { status: 'registered', token };
}

/**
 * 알림 권한을 받고 이 기기의 Expo 푸시 토큰을 서버에 등록한다. 로그인·세션 복원 때마다 부른다.
 * 웹·시뮬레이터처럼 푸시를 받을 수 없는 환경이거나 권한을 거절하면 등록하지 않는다.
 * 네트워크·서버 오류는 던진다 — 부르는 쪽에서 무시하면 다음 앱 실행 때 다시 시도된다.
 */
export function registerPushToken(): Promise<PushTokenRegistration> {
  const registration = register();
  pendingRegistration = registration;
  const settle = () => {
    if (pendingRegistration === registration) pendingRegistration = null;
  };
  registration.then(settle, settle);
  return registration;
}

/**
 * 로그아웃할 때 이 기기의 푸시 토큰을 서버에서 지운다. 만료된 액세스 토큰이어도 된다.
 * 실패해도 저장한 토큰은 지운다 — 다음에 다른 계정으로 로그인하면 서버가 토큰 소유자를 바꾼다.
 */
export async function unregisterPushToken(accessToken: string): Promise<void> {
  await pendingRegistration?.catch(() => undefined);

  const token = await readStoredPushToken();
  if (token === null) return;
  // 서버 요청보다 먼저 지운다. 로그아웃은 이 작업을 기다리지 않으므로, 요청하는 사이 다시 로그인한 계정이
  // 저장한 토큰을 뒤늦게 지우지 않게 하기 위해서다(기기 토큰 값은 계정이 바뀌어도 같다).
  await clearStoredPushToken();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UNREGISTER_TIMEOUT_MS);
  try {
    const baseUrl = resolveApiBaseUrl(process.env.EXPO_PUBLIC_API_URL);
    await deleteDeviceToken(baseUrl, accessToken, token, controller.signal);
  } finally {
    clearTimeout(timer);
  }
}
