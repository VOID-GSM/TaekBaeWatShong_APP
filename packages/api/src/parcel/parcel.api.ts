import { type MyParcelListParams, type Parcel, parcelListResponseSchema } from '@taekbae/types';

import { api, parseResponse } from '../client';

/** `GET /parcel/me` — 로그인한 사용자의 택배 목록. */
export async function fetchMyParcels(params: MyParcelListParams = {}): Promise<Parcel[]> {
  const { data } = await api().get('/parcel/me', { params });
  return parseResponse(parcelListResponseSchema, data).parcels;
}
