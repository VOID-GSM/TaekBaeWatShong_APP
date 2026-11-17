import type { MyParcelListParams } from '@taekbae/types';
import { queryOptions } from '@tanstack/react-query';

import { fetchMyParcels } from './parcel.api';
import { parcelKeys } from './parcel.keys';

export const parcelQueries = {
  mine: (params: MyParcelListParams = {}) =>
    queryOptions({ queryKey: parcelKeys.mine(params), queryFn: () => fetchMyParcels(params) }),
};
