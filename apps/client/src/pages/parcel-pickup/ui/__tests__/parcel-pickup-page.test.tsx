import type * as TaekbaeApi from '@taekbae/api';
import { ApiError, parcelKeys, useClaimParcelMutation } from '@taekbae/api';
import type {
  MyParcelListParams,
  Parcel,
  ParcelClaimRequest,
  ParcelClaimResponse,
} from '@taekbae/types';
import { QueryClient, QueryClientProvider, useMutation } from '@tanstack/react-query';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { useEffect as ReactUseEffect } from 'react';

import { ParcelPickupPage } from '../parcel-pickup-page';

/** `GET /parcel/me` 대신 불리는 요청 */
const mockFetchMine = jest.fn<Promise<Parcel[]>, [MyParcelListParams]>();

jest.mock('@taekbae/api', () => {
  const actual = jest.requireActual<typeof TaekbaeApi>('@taekbae/api');
  return {
    ...actual,
    useClaimParcelMutation: jest.fn(),
    // queryOptions 안의 요청 함수는 모듈 내부 참조라 export 를 바꿔도 안 바뀐다 — 팩토리째 바꾼다.
    parcelQueries: {
      mine: (params: MyParcelListParams = {}) => ({
        queryKey: actual.parcelKeys.mine(params),
        queryFn: () => mockFetchMine(params),
      }),
    },
  };
});

// 화면 포커스는 내비게이터 없이 렌더하므로 마운트 시 한 번 들어온 것으로 본다.
jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual<{ useEffect: typeof ReactUseEffect }>('react');
  return { useFocusEffect: (effect: () => void | (() => void)) => useEffect(effect, [effect]) };
});

jest.setTimeout(10_000);

const pad = (value: number) => String(value).padStart(2, '0');
/** 기기 로컬 시각을 서버 LocalDateTime 문자열로 */
const toLocal = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;

const claimParcel = jest.fn<Promise<ParcelClaimResponse>, [ParcelClaimRequest]>();

const earphone: Parcel = {
  id: 7,
  deliveryCompany: 'CJ대한통운',
  invoiceNumber: '338811025567',
  alias: '무선 이어폰',
  zone: 'A',
  status: 'ARRIVED',
};

function renderPage(claimed: Parcel[] = []) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  queryClient.setQueryData(parcelKeys.mine({ status: 'CLAIMED' }), claimed);
  return render(
    <QueryClientProvider client={queryClient}>
      <ParcelPickupPage />
    </QueryClientProvider>,
  );
}

const scanner = () => screen.getByTestId('barcode-scanner-input', { includeHiddenElements: true });

/** 스캐너는 글자를 타이핑한 뒤 Enter 를 보낸다. */
async function scan(value: string) {
  await fireEvent.changeText(scanner(), value);
  await fireEvent(scanner(), 'submitEditing');
}

const CONFIRM = { name: '회수 완료 처리' };

describe('ParcelPickupPage', () => {
  beforeEach(() => {
    claimParcel.mockReset();
    mockFetchMine.mockReset();
    mockFetchMine.mockImplementation(async (params) =>
      params.status === 'CLAIMED' ? [] : [earphone],
    );
    jest.mocked(useClaimParcelMutation).mockImplementation(() =>
      useMutation<ParcelClaimResponse, ApiError, ParcelClaimRequest>({
        mutationFn: (request) => claimParcel(request),
      }),
    );
  });

  it('스캔하면 회수 전에 택배 정보를 확인 카드로 보여준다', async () => {
    await renderPage();

    await scan('338811025567');

    expect(await screen.findByText('무선 이어폰')).toBeOnTheScreen();
    expect(screen.getByText('A구역 · 3388 1102 5567')).toBeOnTheScreen();
    expect(screen.getByRole('button', CONFIRM)).toBeOnTheScreen();
    expect(screen.queryByText('방금 회수한 택배')).not.toBeOnTheScreen();
    expect(claimParcel).not.toHaveBeenCalled();
  });

  it('회수 완료 처리를 누르면 회수를 요청하고 완료 안내를 띄운 뒤 카드를 닫는다', async () => {
    claimParcel.mockResolvedValue({
      id: 7,
      invoiceNumber: '338811025567',
      alias: '무선 이어폰',
      status: 'CLAIMED',
      message: '회수가 완료되었습니다!',
    });
    await renderPage();
    await scan('338811025567');

    await fireEvent.press(await screen.findByRole('button', CONFIRM));

    expect(claimParcel).toHaveBeenCalledWith({ invoiceNumber: '338811025567' });
    expect(await screen.findByText('회수가 완료되었습니다!')).toBeOnTheScreen();
    expect(screen.queryByRole('button', CONFIRM)).not.toBeOnTheScreen();
    expect(screen.getByText('방금 회수한 택배')).toBeOnTheScreen();
  });

  it('Enter 대신 줄바꿈을 보내는 스캐너도 한 건으로 받는다', async () => {
    await renderPage();

    await fireEvent.changeText(scanner(), '3388-1102-5567\n');

    expect(await screen.findByText('무선 이어폰')).toBeOnTheScreen();
  });

  it('회수 요청이 거절되면 그 사유를 안내하고 카드는 남겨 둔다', async () => {
    claimParcel.mockRejectedValue(new ApiError('본인의 택배만 수령 처리할 수 있습니다.', 403));
    await renderPage();
    await scan('338811025567');

    await fireEvent.press(await screen.findByRole('button', CONFIRM));

    expect(await screen.findByText('본인의 택배만 수령 처리할 수 있습니다.')).toBeOnTheScreen();
    expect(screen.getByRole('button', CONFIRM)).toBeOnTheScreen();
  });

  it.each([
    [404, '택배를 찾을 수 없습니다.'],
    [409, '이미 수령 처리된 택배입니다.'],
  ])('회수 요청이 %i 로 실패하면 다시 눌러도 같으므로 카드를 닫는다', async (status, message) => {
    claimParcel.mockRejectedValue(new ApiError(message, status));
    await renderPage();
    await scan('338811025567');

    await fireEvent.press(await screen.findByRole('button', CONFIRM));

    expect(await screen.findByText(message)).toBeOnTheScreen();
    expect(screen.queryByRole('button', CONFIRM)).not.toBeOnTheScreen();
    expect(screen.getByText('방금 회수한 택배')).toBeOnTheScreen();
  });

  it.each([
    ['내 택배가 아니면', '999988887777', '내 택배 목록에 없는 운송장이에요.'],
    ['도착 전이면', '111122223333', '아직 도착하지 않은 택배예요.'],
    ['이미 회수했으면', '444455556666', '이미 회수한 택배예요.'],
  ])('%s 카드 없이 안내만 띄운다', async (_, invoiceNumber, message) => {
    mockFetchMine.mockResolvedValue([
      earphone,
      { ...earphone, id: 8, invoiceNumber: '111122223333', status: 'PENDING' },
      { ...earphone, id: 9, invoiceNumber: '444455556666', status: 'CLAIMED' },
    ]);
    await renderPage();

    await scan(invoiceNumber);

    expect(await screen.findByText(message)).toBeOnTheScreen();
    expect(screen.queryByRole('button', CONFIRM)).not.toBeOnTheScreen();
  });

  it('운송장 바코드가 아니면 조회하지 않고 다시 스캔하라고 안내한다', async () => {
    await renderPage();

    await scan('ABC12');

    expect(mockFetchMine).not.toHaveBeenCalledWith({});
    expect(screen.getByText('운송장 바코드가 아니에요. 다시 스캔해 주세요.')).toBeOnTheScreen();
  });

  it('조회 중에 잘못된 바코드를 스캔하면 앞선 조회 결과는 반영하지 않는다', async () => {
    let resolveLookup: (parcels: Parcel[]) => void = () => {};
    mockFetchMine.mockImplementation((params) =>
      params.status === 'CLAIMED'
        ? Promise.resolve([])
        : new Promise((resolve) => {
            resolveLookup = resolve;
          }),
    );
    await renderPage();
    await scan('338811025567');

    await scan('ABC12');
    await act(async () => resolveLookup([earphone]));

    expect(screen.getByText('운송장 바코드가 아니에요. 다시 스캔해 주세요.')).toBeOnTheScreen();
    expect(screen.queryByRole('button', CONFIRM)).not.toBeOnTheScreen();
  });

  it('오늘 회수한 택배만 최근 회수 순으로 보여준다', async () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    await renderPage([
      {
        id: 1,
        deliveryCompany: 'CJ대한통운',
        invoiceNumber: '556733881102',
        alias: '운동화',
        ownerName: '최서준',
        zone: 'F',
        status: 'CLAIMED',
        arrivedAt: '2026-07-07T10:10:00',
        claimedAt: toLocal(new Date(now.getTime() - 12_000)),
      },
      {
        id: 2,
        deliveryCompany: 'CJ대한통운',
        invoiceNumber: '772099450031',
        alias: '책',
        ownerName: '정하윤',
        zone: 'E',
        status: 'CLAIMED',
        claimedAt: toLocal(yesterday),
      },
    ]);

    expect(screen.getByText('5567 3388 1102')).toBeOnTheScreen();
    expect(screen.getByText('최서준 · 도착 07.07 10:10')).toBeOnTheScreen();
    expect(screen.getByText('F구역')).toBeOnTheScreen();
    expect(screen.getByText('1건')).toBeOnTheScreen();
    expect(screen.queryByText('7720 9945 0031')).not.toBeOnTheScreen();
  });

  it('회수한 택배가 없으면 빈 안내를 보여준다', async () => {
    await renderPage();

    expect(screen.getByText('오늘 회수한 택배가 아직 없어요')).toBeOnTheScreen();
  });

  it('스캐너 입력칸에 포커스가 있으면 연결됨으로 표시한다', async () => {
    await renderPage();

    await act(() => fireEvent(scanner(), 'focus'));

    expect(screen.getByText('스캐너 연결됨')).toBeOnTheScreen();
  });
});
