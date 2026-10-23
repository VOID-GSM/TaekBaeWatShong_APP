import { fireEvent, render, screen } from '@testing-library/react-native';

import { loginWithDataGsm, useAuthStore } from '@/features/auth';

import { LoginPage } from '../login-page';

jest.mock('@/features/auth', () => ({
  loginWithDataGsm: jest.fn(),
  useAuthStore: jest.requireActual('@/features/auth/model/auth-store').useAuthStore,
}));

const BUTTON_LABEL = 'DataGSM으로 계속하기';

// 캐시가 없는 첫 실행에서는 첫 렌더가 RN 모듈을 지연 로드하느라 기본 5초를 넘길 수 있다.
jest.setTimeout(10_000);

describe('LoginPage', () => {
  beforeEach(() => {
    jest.mocked(loginWithDataGsm).mockReset();
    useAuthStore.setState({ status: 'unauthenticated', user: null, error: null });
  });

  it('버튼을 누르면 DataGSM 로그인을 시작한다', async () => {
    jest.mocked(loginWithDataGsm).mockResolvedValue(true);
    await render(<LoginPage />);

    await fireEvent.press(screen.getByRole('button', { name: BUTTON_LABEL }));

    expect(loginWithDataGsm).toHaveBeenCalledTimes(1);
  });

  it('로그인이 실패하면 에러 문구를 보여준다', async () => {
    jest.mocked(loginWithDataGsm).mockImplementation(async () => {
      useAuthStore.setState({ error: '로그인에 실패했습니다.' });
      throw new Error('로그인에 실패했습니다.');
    });
    await render(<LoginPage />);

    await fireEvent.press(screen.getByRole('button', { name: BUTTON_LABEL }));

    expect(await screen.findByRole('alert')).toHaveTextContent('로그인에 실패했습니다.');
  });

  it('로그인을 취소하면 에러 문구를 띄우지 않는다', async () => {
    jest.mocked(loginWithDataGsm).mockResolvedValue(false);
    await render(<LoginPage />);

    await fireEvent.press(screen.getByRole('button', { name: BUTTON_LABEL }));

    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('로그인 중에는 버튼이 비활성화된다', async () => {
    useAuthStore.setState({ status: 'loading' });
    await render(<LoginPage />);

    const button = screen.getByRole('button', { name: BUTTON_LABEL });
    expect(button).toBeDisabled();
    expect(button).toBeBusy();

    await fireEvent.press(button);
    expect(loginWithDataGsm).not.toHaveBeenCalled();
  });
});
