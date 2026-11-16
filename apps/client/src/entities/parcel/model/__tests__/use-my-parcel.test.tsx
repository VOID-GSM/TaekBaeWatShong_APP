import { parcelKeys } from '@taekbae/api';
import type { Parcel } from '@taekbae/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { useMyParcel } from '../use-my-parcel';

const parcels: Parcel[] = [
  {
    id: 1,
    deliveryCompany: 'CJ대한통운',
    invoiceNumber: '604122378890',
    alias: '겨울 패딩',
    status: 'ARRIVED',
    unclaimedDays: 0,
    createdAt: '2026-07-05T09:00:00',
  },
  {
    id: 2,
    deliveryCompany: '우체국택배',
    invoiceNumber: '111122223333',
    alias: '책',
    status: 'PENDING',
    unclaimedDays: 0,
    createdAt: '2026-07-05T10:00:00',
  },
];

function setup(invoiceNumber: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
  });
  // 캐시를 채워 네트워크 없이 렌더한다. 키 팩토리 사용도 함께 검증된다.
  queryClient.setQueryData(parcelKeys.mine({}), parcels);
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(() => useMyParcel(invoiceNumber), { wrapper });
}

describe('useMyParcel', () => {
  it('내 택배 목록에서 운송장 번호로 찾는다', async () => {
    const { result } = await setup('111122223333');

    expect(result.current.parcel?.alias).toBe('책');
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('목록에 없으면 parcel 은 undefined', async () => {
    const { result } = await setup('999');

    expect(result.current.parcel).toBeUndefined();
    expect(result.current.isPending).toBe(false);
  });
});
