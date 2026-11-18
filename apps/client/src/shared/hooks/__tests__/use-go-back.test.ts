import { renderHook } from '@testing-library/react-native';

import { useGoBack } from '../use-go-back';

jest.mock('expo-router', () => {
  const router = { back: jest.fn(), replace: jest.fn(), canGoBack: jest.fn() };
  return { useRouter: () => router, router };
});

const { router } = jest.requireMock<{
  router: { back: jest.Mock; replace: jest.Mock; canGoBack: jest.Mock };
}>('expo-router');

describe('useGoBack', () => {
  beforeEach(() => jest.clearAllMocks());

  it('뒤로 갈 화면이 있으면 뒤로 간다', async () => {
    router.canGoBack.mockReturnValue(true);
    const { result } = await renderHook(() => useGoBack());

    result.current();

    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('뒤로 갈 화면이 없으면 홈으로 보낸다', async () => {
    router.canGoBack.mockReturnValue(false);
    const { result } = await renderHook(() => useGoBack());

    result.current();

    expect(router.replace).toHaveBeenCalledWith('/');
  });
});
