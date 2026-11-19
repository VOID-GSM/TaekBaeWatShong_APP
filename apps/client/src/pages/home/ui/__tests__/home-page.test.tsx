import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { logout, useAuthStore } from '@/features/auth';
import { confirmAsync } from '@/shared/lib';

import { HomePage } from '../home-page';

jest.mock('@/features/auth', () => ({
  ...jest.requireActual('@/features/auth'),
  logout: jest.fn(() => Promise.resolve()),
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

describe('HomePage', () => {
  beforeEach(() => {
    router.push.mockClear();
    jest.mocked(logout).mockClear();
    jest.mocked(confirmAsync).mockClear();
    useAuthStore.setState({ error: null });
  });

  it('택배 카드의 분실 신고를 누르면 그 택배의 분실 신고 화면으로 이동한다', async () => {
    await render(<HomePage />);

    // 최신순 첫 카드는 도착(무선 이어폰, 3388 1102 5567)이다.
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
