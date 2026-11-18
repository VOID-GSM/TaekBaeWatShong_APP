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

/**
 * `POST /parcel` 요청. 응답은 서버 `ParcelResponse` 라 `parcelSchema` 로 검증한다.
 * `alias` 를 비우면 서버가 사용자 이름을 별칭으로 저장한다. 값 검증은 폼 스키마가 맡는다.
 */
export interface ParcelRegisterRequest {
  deliveryCompany: string;
  invoiceNumber: string;
  alias?: string;
}

/**
 * `GET /parcel/zone/summary` 응답 — 구역별 보관(ARRIVED) 택배 수. 사용자 앱 약도용이라 택배 정보 없이 수만 받는다.
 * 서버에 아직 없는 API다(관리자용 `GET /parcel/zone` 은 사용자 권한으로 403). 백엔드 이슈 계약 기준.
 */
export const zoneSummaryResponseSchema = z.object({
  zones: z.array(z.object({ zone: z.string(), count: z.number() })),
});

/**
 * `GET /parcel/unclaimed/ranking` 응답 — 도착 후 24시간이 지나도 찾아가지 않은 택배를 오래된 순으로 최대 3건.
 * 서버에 아직 없는 API다. 백엔드 이슈 계약 기준. 방치 시간은 `arrivedAt` 으로 화면에서 계산한다.
 */
export const unclaimedRankingResponseSchema = z.object({
  ranks: z.array(
    z.object({
      rank: z.number(),
      ownerName: z.string(),
      alias: z.string(),
      zone: z.string().nullish(),
      arrivedAt: z.string(),
    }),
  ),
});

export type ZoneSummaryResponse = z.infer<typeof zoneSummaryResponseSchema>;
export type UnclaimedRank = z.infer<typeof unclaimedRankingResponseSchema>['ranks'][number];
