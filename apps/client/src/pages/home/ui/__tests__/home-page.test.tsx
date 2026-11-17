import { fireEvent, render, screen } from '@testing-library/react-native';

import { HomePage } from '../home-page';

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
});
