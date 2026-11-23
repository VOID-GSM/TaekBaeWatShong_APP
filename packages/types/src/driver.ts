import { z } from 'zod';

/** `POST /qr` 요청 (관리자). 호출할 때마다 새 기사와 새 QR 토큰이 만들어진다. 값 검증은 폼 스키마가 맡는다. */
export interface DriverQrCreateRequest {
  driverName: string;
  deliveryCompany: string;
}

/** `POST /qr` 응답 — 서버 `DriverQrCreateResponse`. `qrImageUrl` 은 300×300 PNG data URL 이다. */
export const driverQrSchema = z.object({
  id: z.number(),
  driverName: z.string(),
  deliveryCompany: z.string(),
  qrToken: z.string(),
  qrImageUrl: z.string().startsWith('data:image/'),
  createdAt: z.string(),
});

/** `POST /qr/scan` 요청 (관리자). `qrToken` 은 QR 코드에 담긴 값 그대로다. */
export interface DriverQrScanRequest {
  qrToken: string;
}

/** `POST /qr/scan` 응답 — 서버 `DriverQrScanResponse`. `scannedAt` 은 타임존 없는 `LocalDateTime`. */
export const driverQrScanResultSchema = z.object({
  driverId: z.number(),
  driverName: z.string(),
  deliveryCompany: z.string(),
  scannedAt: z.string(),
});

export type DriverQr = z.infer<typeof driverQrSchema>;
export type DriverQrScanResult = z.infer<typeof driverQrScanResultSchema>;
