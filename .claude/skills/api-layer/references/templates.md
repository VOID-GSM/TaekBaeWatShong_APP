# API 계층 초기 템플릿

코드가 아직 없을 때 이 형태로 시작한다. 이미 있으면 기존 코드가 우선.

## packages/types/src/parcel.ts

```ts
import { z } from 'zod';

export const parcelStatusSchema = z.enum(['ARRIVED', 'RECEIVED']);

export const parcelSchema = z.object({
  id: z.number(),
  trackingNumber: z.string(),
  courier: z.string(),
  status: parcelStatusSchema,
  arrivedAt: z.iso.datetime(),
  receivedAt: z.iso.datetime().nullable(),
});
export type Parcel = z.infer<typeof parcelSchema>;

export const parcelListSchema = z.array(parcelSchema);

export const parcelListParamsSchema = z.object({
  status: parcelStatusSchema.optional(),
});
export type ParcelListParams = z.infer<typeof parcelListParamsSchema>;
```

## packages/api/src/client.ts

```ts
import axios, { AxiosError, type AxiosInstance } from 'axios';

export interface ApiConfig {
  baseURL: string;
  getAccessToken: () => Promise<string | null>;
  /** 401 이 났을 때 앱이 할 일 (토큰 삭제, 로그인 화면 이동 등) */
  onUnauthorized?: () => void;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let instance: AxiosInstance | null = null;

export function configureApi(config: ApiConfig) {
  instance = axios.create({ baseURL: config.baseURL, timeout: 10_000 });

  instance.interceptors.request.use(async (req) => {
    const token = await config.getAccessToken();
    if (token) req.headers.Authorization = `Bearer ${token}`;
    return req;
  });

  instance.interceptors.response.use(
    (res) => res,
    (error: AxiosError<{ message?: string; code?: string }>) => {
      const status = error.response?.status;
      if (status === 401) config.onUnauthorized?.();
      const message =
        error.response?.data?.message ??
        (error.code === 'ECONNABORTED'
          ? '요청 시간이 초과되었습니다.'
          : '네트워크 오류가 발생했습니다.');
      return Promise.reject(new ApiError(message, status, error.response?.data?.code));
    },
  );
}

export function api(): AxiosInstance {
  if (!instance) throw new Error('configureApi() 가 먼저 호출되어야 합니다.');
  return instance;
}
```

토큰 갱신(refresh)이 필요해지면 response 인터셉터에서 401 → refresh 요청 1회 → 원요청 재시도. 동시 401에 refresh가 여러 번 나가지 않도록 진행 중 Promise를 공유한다.

## packages/api/src/parcel/

```ts
// parcel.keys.ts
import type { ParcelListParams } from '@taekbae/types';

export const parcelKeys = {
  all: ['parcel'] as const,
  lists: () => [...parcelKeys.all, 'list'] as const,
  list: (params: ParcelListParams) => [...parcelKeys.lists(), params] as const,
  detail: (id: number) => [...parcelKeys.all, 'detail', id] as const,
};
```

```ts
// parcel.api.ts
import { type ParcelListParams, parcelListSchema, parcelSchema } from '@taekbae/types';

import { api } from '../client';

export async function fetchParcels(params: ParcelListParams) {
  const { data } = await api().get('/parcels', { params });
  return parcelListSchema.parse(data);
}

export async function receiveParcel(id: number) {
  const { data } = await api().patch(`/parcels/${id}/receive`);
  return parcelSchema.parse(data);
}
```

```ts
// parcel.queries.ts
import type { ParcelListParams } from '@taekbae/types';
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';

import { fetchParcels, receiveParcel } from './parcel.api';
import { parcelKeys } from './parcel.keys';

export const parcelQueries = {
  list: (params: ParcelListParams = {}) =>
    queryOptions({ queryKey: parcelKeys.list(params), queryFn: () => fetchParcels(params) }),
};

export function useReceiveParcelMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: receiveParcel,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: parcelKeys.all }),
  });
}
```

```ts
// index.ts
export * from './parcel.keys';
export * from './parcel.queries';
```

## apps/client/src/shared/api/configure.ts

```ts
import { configureApi } from '@taekbae/api';
import * as SecureStore from 'expo-secure-store';

export const ACCESS_TOKEN_KEY = 'accessToken';

export function setupApi(onUnauthorized: () => void) {
  configureApi({
    baseURL: process.env.EXPO_PUBLIC_API_URL!,
    getAccessToken: () => SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
    onUnauthorized,
  });
}
```

`app/providers`에서 앱 시작 시 한 번 호출한다. QueryClient 기본값 예:

```ts
new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
    mutations: { retry: 0 },
  },
});
```
