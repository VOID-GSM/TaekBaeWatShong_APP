import {
  type MyParcelListParams,
  type Parcel,
  type ParcelClaimRequest,
  type ParcelClaimResponse,
  parcelClaimResponseSchema,
  parcelListResponseSchema,
  type ParcelRegisterRequest,
  parcelSchema,
  type UnclaimedRank,
  unclaimedRankingResponseSchema,
  type ZoneSummaryResponse,
  zoneSummaryResponseSchema,
} from '@taekbae/types';

import { api, parseResponse } from '../client';

/** `GET /parcel/me` — 로그인한 사용자의 택배 목록. */
export async function fetchMyParcels(params: MyParcelListParams = {}): Promise<Parcel[]> {
  const { data } = await api().get('/parcel/me', { params });
  return parseResponse(parcelListResponseSchema, data).parcels;
}

/** `POST /parcel` — 받을 택배를 운송장 번호로 등록한다. 등록된 택배는 PENDING 으로 시작한다. */
export async function registerParcel(request: ParcelRegisterRequest): Promise<Parcel> {
  const { data } = await api().post('/parcel', request);
  return parseResponse(parcelSchema, data);
}

/** `GET /parcel/zone/summary` — 구역별 보관 중인 택배 수. */
export async function fetchZoneSummary(): Promise<ZoneSummaryResponse['zones']> {
  const { data } = await api().get('/parcel/zone/summary');
  return parseResponse(zoneSummaryResponseSchema, data).zones;
}

/** `GET /parcel/unclaimed/ranking` — 도착 후 24시간 넘게 찾아가지 않은 택배 TOP3. */
export async function fetchUnclaimedRanking(): Promise<UnclaimedRank[]> {
  const { data } = await api().get('/parcel/unclaimed/ranking');
  return parseResponse(unclaimedRankingResponseSchema, data).ranks;
}

/**
 * `PATCH /parcel/claim` — 보관함에서 가져간 택배를 수령(CLAIMED) 처리한다.
 * 403(남의 택배)·404(없는 운송장)·409(도착 전·이미 수령)는 서버가 한국어 message 를 보낸다.
 */
export async function claimParcel(request: ParcelClaimRequest): Promise<ParcelClaimResponse> {
  const { data } = await api().patch('/parcel/claim', request);
  return parseResponse(parcelClaimResponseSchema, data);
}
