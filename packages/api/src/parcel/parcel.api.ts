import {
  type MyParcelListParams,
  type Parcel,
  parcelListResponseSchema,
  type ParcelRegisterRequest,
  parcelSchema,
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
