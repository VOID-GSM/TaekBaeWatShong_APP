import {
  type DriverQr,
  type DriverQrCreateRequest,
  type DriverQrScanRequest,
  type DriverQrScanResult,
  driverQrScanResultSchema,
  driverQrSchema,
} from '@taekbae/types';

import { api, parseResponse } from '../client';

/** `POST /qr` — 택배기사를 등록하고 기사를 식별하는 QR 을 발급한다 (관리자). */
export async function createDriverQr(request: DriverQrCreateRequest): Promise<DriverQr> {
  const { data } = await api().post('/qr', request);
  return parseResponse(driverQrSchema, data);
}

/**
 * `POST /qr/scan` — 기사 QR 을 스캔해 방문 기록을 남긴다 (관리자).
 * 같은 QR 을 여러 번 스캔하면 기록이 따로 남는다. 404 는 발급된 적 없는 QR 이다.
 */
export async function scanDriverQr(request: DriverQrScanRequest): Promise<DriverQrScanResult> {
  const { data } = await api().post('/qr/scan', request);
  return parseResponse(driverQrScanResultSchema, data);
}
