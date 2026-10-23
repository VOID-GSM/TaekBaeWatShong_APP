import { fireEvent, render, screen } from '@testing-library/react-native';

import { loginAdmin, useAdminAuthStore } from '@/features/auth';

import { LoginPage } from '../login-page';

jest.mock('@/features/auth', () => ({
  loginAdmin: jest.fn(),
  useAdminAuthStore: jest.requireActual('@/features/auth/model/auth-store').useAdminAuthStore,
}));

const DATAGSM_LABEL = 'DataGSM으로 계속하기';
const GOOGLE_LABEL = 'Google로 계속하기';

// 캐시가 없는 첫 실행에서는 첫 렌더가 RN 모듈을 지연 로드하느라 기본 5초를 넘길 수 있다.
jest.setTimeout(10_000);

describe('LoginPage', () => {
  beforeEach(() => {
    jest.mocked(loginAdmin).mockReset();
    useAdminAuthStore.setState({ status: 'unauthenticated', user: null, error: null });
  });

  it.each([
    [DATAGSM_LABEL, 'datagsm'],
    [GOOGLE_LABEL, 'google'],
  ] as const)('%s 버튼을 누르면 %s 로그인을 시작한다', async (label, provider) => {
    jest.mocked(loginAdmin).mockResolvedValue(true);
    await render(<LoginPage />);

    await fireEvent.press(screen.getByRole('button', { name: label }));

    expect(loginAdmin).toHaveBeenCalledTimes(1);
    expect(loginAdmin).toHaveBeenCalledWith(provider);
  });

  it('로그인이 실패하면 에러 문구를 보여준다', async () => {
    jest.mocked(loginAdmin).mockImplementation(async () => {
      useAdminAuthStore.setState({ error: '로그인에 실패했습니다.' });
      throw new Error('로그인에 실패했습니다.');
    });
    await render(<LoginPage />);

    await fireEvent.press(screen.getByRole('button', { name: DATAGSM_LABEL }));

    expect(await screen.findByRole('alert')).toHaveTextContent('로그인에 실패했습니다.');
  });

  it('로그인을 취소하면 에러 문구를 띄우지 않는다', async () => {
    jest.mocked(loginAdmin).mockResolvedValue(false);
    await render(<LoginPage />);

    await fireEvent.press(screen.getByRole('button', { name: GOOGLE_LABEL }));

    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('로그인 중에는 누른 버튼만 로딩되고 두 버튼 모두 비활성화된다', async () => {
    jest.mocked(loginAdmin).mockImplementation(async () => {
      useAdminAuthStore.setState({ status: 'loading' });
      return new Promise<boolean>(() => {});
    });
    await render(<LoginPage />);

    await fireEvent.press(screen.getByRole('button', { name: GOOGLE_LABEL }));

    const google = screen.getByRole('button', { name: GOOGLE_LABEL });
    const dataGsm = screen.getByRole('button', { name: DATAGSM_LABEL });
    expect(google).toBeBusy();
    expect(dataGsm).not.toBeBusy();
    expect(google).toBeDisabled();
    expect(dataGsm).toBeDisabled();

    await fireEvent.press(dataGsm);
    expect(loginAdmin).toHaveBeenCalledTimes(1);
  });
});
