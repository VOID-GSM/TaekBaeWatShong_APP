import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { SignUpPage } from '../sign-up-page';

const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, canGoBack: () => true }),
}));

// 캐시가 없는 첫 실행에서는 첫 렌더가 RN 모듈을 지연 로드하느라 기본 5초를 넘길 수 있다.
jest.setTimeout(10_000);

describe('SignUpPage', () => {
  beforeEach(() => {
    mockBack.mockReset();
  });

  it('이름을 입력하고 가입 완료를 누르면 앞뒤 공백을 뗀 이름으로 제출한다', async () => {
    const onSubmit = jest.fn();
    await render(<SignUpPage onSubmit={onSubmit} />);

    await fireEvent.changeText(screen.getByLabelText('이름'), ' 이선생 ');
    await fireEvent.press(screen.getByRole('button', { name: '가입 완료' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ name: '이선생' }));
  });

  it('이름이 비어 있으면 제출하지 않고 안내 문구를 보여준다', async () => {
    const onSubmit = jest.fn();
    await render(<SignUpPage onSubmit={onSubmit} />);

    await fireEvent.press(screen.getByRole('button', { name: '가입 완료' }));

    expect(await screen.findByText('이름을 입력해 주세요.')).toBeOnTheScreen();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('뒤로가기를 누르면 이전 화면으로 돌아간다', async () => {
    await render(<SignUpPage />);

    await fireEvent.press(screen.getByRole('button', { name: '뒤로가기' }));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
