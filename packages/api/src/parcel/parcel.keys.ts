import type { MyParcelListParams } from '@taekbae/types';

export const parcelKeys = {
  all: ['parcel'] as const,
  mine: (params: MyParcelListParams) => [...parcelKeys.all, 'mine', params] as const,
  zoneSummary: () => [...parcelKeys.all, 'zone-summary'] as const,
  unclaimedRanking: () => [...parcelKeys.all, 'unclaimed-ranking'] as const,
};
