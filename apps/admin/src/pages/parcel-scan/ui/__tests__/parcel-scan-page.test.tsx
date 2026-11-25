import type * as TaekbaeApi from '@taekbae/api';
import { ApiError } from '@taekbae/api';
import type { Parcel, ParcelCompleteRequest } from '@taekbae/types';
import type * as ReactQuery from '@tanstack/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { useEffect as ReactUseEffect } from 'react';

import { ParcelScanPage } from '../parcel-scan-page';

const mockCompleteParcel = jest.fn<Promise<Parcel>, [ParcelCompleteRequest]>();

// 요청 함수는 훅 안에서 모듈 내부 참조로 불려 export 를 바꿔도 안 바뀐다 — 훅째 바꾼다.
jest.mock('@taekbae/api', () => {
  const actual = jest.requireActual<typeof TaekbaeApi>('@taekbae/api');
  const query = jest.requireActual<typeof ReactQuery>('@tanstack/react-query');
  return {
    ...actual,
    useCompleteParcelMutation: () => query.useMutation({ mutationFn: mockCompleteParcel }),
  };
});

// 화면 포커스는 내비게이터 없이 렌더하므로 마운트 시 한 번 들어온 것으로 본다.
jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual<{ useEffect: typeof ReactUseEffect }>('react');
  return { useFocusEffect: (effect: () => void | (() => void)) => useEffect(effect, [effect]) };
});

const parcel: Parcel = {
  id: 7,
  deliveryCompany: 'CJ대한통운',
  invoiceNumber: '123456789012',
  alias: '홍길동 택배',
  ownerName: '홍길동',
  zone: 'B',
  status: 'ARRIVED',
  arrivedAt: '2026-11-24T10:00:00',
  claimedAt: null,
  unclaimedDays: 0,
  createdAt: '2026-11-20T09:00:00',
};

async function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return await render(
    <QueryClientProvider client={queryClient}>
      <ParcelScanPage />
    </QueryClientProvider>,
  );
}

/** 바코드 스캐너처럼 값을 넣고 Enter 를 보낸다. */
async function scan(value: string) {
  const input = screen.getByTestId('scan-input');
  await fireEvent.changeText(input, value);
  await act(async () => {
    fireEvent(input, 'submitEditing');
  });
}

describe('ParcelScanPage', () => {
  beforeEach(() => {
    mockCompleteParcel.mockReset();
  });

  it('스캔 전에는 대기 안내를 보여준다', async () => {
    await renderPage();

    expect(screen.getByText('바코드를 스캔해 주세요')).toBeOnTheScreen();
    expect(screen.getByText('이번에 처리한 택배 0건')).toBeOnTheScreen();
  });

  it('Enter 를 받으면 앞뒤 공백을 떼고 도착 처리를 요청하고, 입력칸을 바로 비운다', async () => {
    mockCompleteParcel.mockResolvedValue(parcel);
    await renderPage();

    await scan(' 123456789012 ');

    expect(mockCompleteParcel.mock.calls[0]?.[0]).toEqual({ invoiceNumber: '123456789012' });
    expect(screen.getByTestId('scan-input').props.value).toBe('');
    expect(await screen.findByText('도착 처리 완료')).toBeOnTheScreen();
    // 결과 카드와 처리 기록에 한 번씩 보인다.
    expect(screen.getAllByText('홍길동 택배')).toHaveLength(2);
    expect(screen.getAllByText('1234 5678 9012')).toHaveLength(2);
    expect(screen.getByText('이번에 처리한 택배 1건')).toBeOnTheScreen();
  });

  it('구역을 고르면 요청에 zone 을 함께 보낸다', async () => {
    mockCompleteParcel.mockResolvedValue(parcel);
    await renderPage();

    await fireEvent.press(screen.getByRole('radio', { name: 'B 구역' }));
    await scan('123456789012');

    expect(mockCompleteParcel.mock.calls[0]?.[0]).toEqual({
      invoiceNumber: '123456789012',
      zone: 'B',
    });
    expect(await screen.findAllByText('B 구역')).toHaveLength(2);
  });

  it('"선택 안 함"으로 돌리면 zone 을 빼고 보낸다', async () => {
    mockCompleteParcel.mockResolvedValue({ ...parcel, zone: null });
    await renderPage();

    await fireEvent.press(screen.getByRole('radio', { name: 'C 구역' }));
    await fireEvent.press(screen.getByRole('radio', { name: '구역 선택 안 함' }));
    await scan('123456789012');

    expect(mockCompleteParcel.mock.calls[0]?.[0]).toEqual({ invoiceNumber: '123456789012' });
    expect(screen.getByRole('radio', { name: '구역 선택 안 함' })).toBeSelected();
  });

  it('빈 Enter 는 요청하지 않는다', async () => {
    await renderPage();

    await scan('   ');

    expect(mockCompleteParcel).not.toHaveBeenCalled();
  });

  it('등록되지 않은 운송장(404)이면 고정 문구를 보여준다', async () => {
    mockCompleteParcel.mockRejectedValue(new ApiError('존재하지 않는 택배입니다.', 404));
    await renderPage();

    await scan('999999999999');

    expect(await screen.findByText('등록되지 않은 택배')).toBeOnTheScreen();
    expect(screen.queryByText('존재하지 않는 택배입니다.')).toBeNull();
  });

  it('이미 처리된 택배(409)는 오류가 아닌 안내로 보여준다', async () => {
    mockCompleteParcel.mockRejectedValue(new ApiError('이미 도착 처리된 택배입니다.', 409));
    await renderPage();

    await scan('123456789012');

    expect(await screen.findByText('이미 처리된 택배')).toBeOnTheScreen();
    expect(screen.getByText('확인 필요')).toBeOnTheScreen();
    expect(screen.queryByText('처리 실패')).toBeNull();
  });

  it('그 밖의 실패는 서버 메시지를 보여준다', async () => {
    mockCompleteParcel.mockRejectedValue(new ApiError('관리자만 처리할 수 있어요.', 403));
    await renderPage();

    await scan('123456789012');

    expect(await screen.findByText('관리자만 처리할 수 있어요.')).toBeOnTheScreen();
    expect(screen.getByText('처리 실패')).toBeOnTheScreen();
  });
});
