import AsyncStorage from '@react-native-async-storage/async-storage';
import { type DriverQr, driverQrSchema } from '@taekbae/types';
import { queryOptions } from '@tanstack/react-query';

/**
 * 이 기기에서 마지막으로 발급한 기사 QR.
 * 서버는 발급한 QR 을 다시 돌려주지 않으므로, 발급한 기기에 저장해 앱을 다시 켜도 보여 준다.
 * QR 이미지(data URL)가 secure-store 한도(약 2KB)를 넘어 AsyncStorage 에 둔다 — 비밀 값은 아니다.
 */
const STORAGE_KEY = 'driver-qr/issued';

export async function loadIssuedDriverQr(): Promise<DriverQr | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return driverQrSchema.parse(JSON.parse(raw));
  } catch {
    // 형식이 바뀌었거나 깨진 값이면 버린다.
    await AsyncStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export async function saveIssuedDriverQr(qr: DriverQr): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(qr));
}

export const issuedDriverQrQuery = queryOptions({
  queryKey: ['driver-qr', 'issued'] as const,
  queryFn: loadIssuedDriverQr,
  staleTime: Infinity,
  gcTime: Infinity,
});
