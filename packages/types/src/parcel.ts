import { z } from 'zod';

export const parcelStatusSchema = z.enum(['PENDING', 'ARRIVED', 'CLAIMED']);

/**
 * 서버 `ParcelResponse`. 날짜는 타임존 없는 `LocalDateTime` 문자열이다.
 * 목록 응답이라 택배 하나만 어긋나도 전체 조회가 실패하므로, 화면이 쓰는 필드(id, 택배사, 운송장 번호, 별칭)만
 * 엄격하게 보고 나머지는 새 값·null 이 와도 통과시킨다.
 */
export const parcelSchema = z.object({
  id: z.number(),
  deliveryCompany: z.string(),
  invoiceNumber: z.string(),
  alias: z.string(),
  ownerName: z.string().nullish(),
  zone: z.string().nullish(),
  status: z.string(),
  arrivedAt: z.string().nullish(),
  claimedAt: z.string().nullish(),
  unclaimedDays: z.number().nullish(),
  createdAt: z.string().nullish(),
});

/** `GET /parcel/me` 응답. */
export const parcelListResponseSchema = z.object({
  parcels: z.array(parcelSchema),
});

export type ParcelStatus = z.infer<typeof parcelStatusSchema>;
export type Parcel = z.infer<typeof parcelSchema>;
export type ParcelListResponse = z.infer<typeof parcelListResponseSchema>;

export type MyParcelListParams = { status?: ParcelStatus };
