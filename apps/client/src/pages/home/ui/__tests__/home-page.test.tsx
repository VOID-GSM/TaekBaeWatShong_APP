import { ApiError } from '@taekbae/api';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { type Parcel, useMyParcels, type UseMyParcelsResult } from '@/entities/parcel';
import { logout, useAuthStore } from '@/features/auth';
import { confirmAsync } from '@/shared/lib';

import { HomePage } from '../home-page';

jest.mock('@/features/auth', () => ({
  ...jest.requireActual('@/features/auth'),
  logout: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/entities/parcel', () => ({
  ...jest.requireActual('@/entities/parcel'),
  useMyParcels: jest.fn(),
}));

jest.mock('@/shared/lib', () => ({
  ...jest.requireActual('@/shared/lib'),
  confirmAsync: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('expo-router', () => {
  const router = { push: jest.fn() };
  return { useRouter: () => router, router };
});

jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return {
    SafeAreaView: View,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

const { router } = jest.requireMock<{ router: { push: jest.Mock } }>('expo-router');

// 캐시가 없는 첫 실행에서는 첫 렌더가 RN 모듈을 지연 로드하느라 기본 5초를 넘길 수 있다.
jest.setTimeout(10_000);

const PARCELS: Parcel[] = [
  {
    id: 1,
    name: '겨울 패딩',
    carrier: 'CJ대한통운',
    trackingNumber: '604122378890',
    status: 'overdue',
    createdAt: new Date(2026, 6, 4, 10),
    zone: 'C',
    arrivedAt: '07.06 16:40',
    timeLabel: '1일 03:24',
  },
  {
    id: 2,
    name: '무선 이어폰',
    carrier: '한진택배',
    trackingNumber: '338811025567',
    status: 'arrived',
    createdAt: new Date(2026, 6, 5, 9),
    zone: 'A',
    arrivedAt: '07.07 07:30',
    timeLabel: '0일 02:11',
  },
];

const parcelsResult = (overrides: Partial<UseMyParcelsResult> = {}): UseMyParcelsResult => ({
  parcels: PARCELS,
  summary: { total: 2, arrived: 2, overdue: 1 },
  isPending: false,
  isRefetching: false,
  error: null,
  refetch: jest.fn(),
  ...overrides,
});

describe('HomePage', () => {
  beforeEach(() => {
    router.push.mockClear();
    jest.mocked(logout).mockClear();
    jest.mocked(confirmAsync).mockClear();
    useAuthStore.setState({ error: null });
    jest.mocked(useMyParcels).mockReturnValue(parcelsResult());
  });

  it('서버에서 받은 내 택배와 요약을 보여준다', async () => {
    await render(<HomePage />);

    expect(screen.getByText('무선 이어폰')).toBeOnTheScreen();
    expect(screen.getByText('겨울 패딩')).toBeOnTheScreen();
    expect(screen.getByText('2개')).toBeOnTheScreen();
    expect(screen.getByLabelText('방치 1개')).toBeOnTheScreen();
  });

  it('불러오는 중에는 로딩을 보여준다', async () => {
    jest
      .mocked(useMyParcels)
      .mockReturnValue(parcelsResult({ parcels: undefined, summary: undefined, isPending: true }));
    await render(<HomePage />);

    expect(screen.getByLabelText('내 택배를 불러오는 중')).toBeOnTheScreen();
  });

  it('불러오지 못하면 에러와 다시 시도를 보여준다', async () => {
    const refetch = jest.fn();
    jest.mocked(useMyParcels).mockReturnValue(
      parcelsResult({
        parcels: undefined,
        summary: undefined,
        error: new ApiError('네트워크 오류가 발생했습니다.'),
        refetch,
      }),
    );
    await render(<HomePage />);

    expect(screen.getByRole('alert')).toHaveTextContent('내 택배를 불러오지 못했어요.');
    await fireEvent.press(screen.getByRole('button', { name: '다시 시도' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('택배가 없으면 빈 목록 문구를 보여준다', async () => {
    jest
      .mocked(useMyParcels)
      .mockReturnValue(
        parcelsResult({ parcels: [], summary: { total: 0, arrived: 0, overdue: 0 } }),
      );
    await render(<HomePage />);

    expect(screen.getByText('아직 등록된 택배가 없어요.')).toBeOnTheScreen();
  });

  it('택배 카드의 분실 신고를 누르면 그 택배의 분실 신고 화면으로 이동한다', async () => {
    await render(<HomePage />);

    // 최신순 첫 카드는 도착(무선 이어폰, 338811025567)이다.
    await fireEvent.press(screen.getAllByRole('button', { name: '분실 신고' })[0]!);

    expect(router.push).toHaveBeenCalledWith({
      pathname: '/report/[invoiceNumber]',
      params: { invoiceNumber: '338811025567' },
    });
  });

  it('인사말 옆 "택배 약도 확인하기"를 누르면 약도·방치자 화면으로 이동한다', async () => {
    await render(<HomePage />);

    await fireEvent.press(screen.getByRole('link', { name: '택배 약도 확인하기' }));

    expect(router.push).toHaveBeenCalledWith('/zone');
  });

  it('이름 옆 "로그아웃"을 누르면 확인을 받은 뒤 로그아웃한다', async () => {
    await render(<HomePage />);

    await fireEvent.press(screen.getByRole('button', { name: '로그아웃' }));

    expect(confirmAsync).toHaveBeenCalledWith(
      expect.objectContaining({ title: '로그아웃할까요?', destructive: true }),
    );
    expect(logout).toHaveBeenCalledTimes(1);
  });

  it('확인 창에서 취소하면 로그아웃하지 않는다', async () => {
    jest.mocked(confirmAsync).mockResolvedValueOnce(false);
    await render(<HomePage />);

    await fireEvent.press(screen.getByRole('button', { name: '로그아웃' }));

    expect(confirmAsync).toHaveBeenCalledTimes(1);
    expect(logout).not.toHaveBeenCalled();
  });

  it('로그아웃 중에는 링크를 비활성화하고, 실패하면 문구를 보여준다', async () => {
    let fail: (error: Error) => void = () => {};
    jest.mocked(logout).mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          fail = reject;
        }),
    );
    await render(<HomePage />);
    const link = screen.getByRole('button', { name: '로그아웃' });

    await fireEvent.press(link);
    await fireEvent.press(link);
    expect(logout).toHaveBeenCalledTimes(1);
    expect(link).toBeDisabled();

    useAuthStore.setState({
      error: '로그아웃 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    });
    await act(async () => fail(new Error('SecureStore')));

    expect(screen.getByRole('alert')).toHaveTextContent('로그아웃 중 문제가 발생했습니다', {
      exact: false,
    });
    expect(link).toBeEnabled();
  });
});
