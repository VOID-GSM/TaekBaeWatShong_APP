import * as SecureStore from 'expo-secure-store';

/** 서버에 등록한 이 기기의 푸시 토큰. 로그아웃할 때 어떤 토큰을 지울지 알기 위해 둔다. */
const PUSH_TOKEN_STORAGE_KEY = 'taekbaewatshong.push.deviceToken';

export async function storePushToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(PUSH_TOKEN_STORAGE_KEY, token);
}

export async function readStoredPushToken(): Promise<string | null> {
  return SecureStore.getItemAsync(PUSH_TOKEN_STORAGE_KEY);
}

export async function clearStoredPushToken(): Promise<void> {
  await SecureStore.deleteItemAsync(PUSH_TOKEN_STORAGE_KEY);
}
