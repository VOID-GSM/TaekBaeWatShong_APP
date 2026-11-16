import { z } from 'zod';

export const parcelStatusSchema = z.enum(['PENDING', 'ARRIVED', 'CLAIMED']);

export const parcelZoneSchema = z.enum(['A', 'B', 'C', 'D', 'E', 'F']);

/** 서버 `ParcelResponse`. 날짜는 타임존 없는 `LocalDateTime` 문자열이다. */
export const parcelSchema = z.object({
  id: z.number(),
  deliveryCompany: z.string(),
  invoiceNumber: z.string(),
  alias: z.string(),
  ownerName: z.string().nullish(),
  zone: parcelZoneSchema.nullish(),
  status: parcelStatusSchema,
  arrivedAt: z.iso.datetime({ local: true }).nullish(),
  claimedAt: z.iso.datetime({ local: true }).nullish(),
  unclaimedDays: z.number(),
  createdAt: z.iso.datetime({ local: true }),
});

/** `GET /parcel/me` 응답. */
export const parcelListResponseSchema = z.object({
  parcels: z.array(parcelSchema),
});

export type ParcelStatus = z.infer<typeof parcelStatusSchema>;
export type ParcelZone = z.infer<typeof parcelZoneSchema>;
export type Parcel = z.infer<typeof parcelSchema>;
export type ParcelListResponse = z.infer<typeof parcelListResponseSchema>;

export type MyParcelListParams = { status?: ParcelStatus };
