import type { Parcel } from '@taekbae/types';

/** 보관함 구역. 서버 구역 요약(`GET /parcel/zone/summary`)과 같은 A~F. */
export const PARCEL_ZONES = ['A', 'B', 'C', 'D', 'E', 'F'] as const;
export type ParcelZone = (typeof PARCEL_ZONES)[number];

/** 스캔 한 건의 결과. 409(이미 처리됨)는 오류가 아니라 안내로 보여 주려고 따로 둔다. */
export type ArrivalScanResult =
  | { id: number; type: 'success'; parcel: Parcel }
  | { id: number; type: 'notFound'; invoiceNumber: string }
  | { id: number; type: 'alreadyDone'; invoiceNumber: string }
  | { id: number; type: 'error'; invoiceNumber: string; message: string };

/** 이번 화면에서 도착 처리한 택배. `processedAt` 은 `Date.now()`. */
export interface ProcessedParcel {
  id: number;
  parcel: Parcel;
  processedAt: number;
}

/** 처리 기록을 최신순으로 이만큼만 남긴다. */
export const RECENT_LIMIT = 50;
