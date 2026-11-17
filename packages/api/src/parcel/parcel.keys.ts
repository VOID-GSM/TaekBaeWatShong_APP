import type { MyParcelListParams } from '@taekbae/types';

export const parcelKeys = {
  all: ['parcel'] as const,
  mine: (params: MyParcelListParams) => [...parcelKeys.all, 'mine', params] as const,
};
