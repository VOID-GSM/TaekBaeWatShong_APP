import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { ParcelRegisterPage } from '../parcel-register-page';

// 캐시가 없는 첫 실행에서는 첫 렌더가 RN 모듈을 지연 로드하느라 기본 5초를 넘길 수 있다.
jest.setTimeout(10_000);

const SUBMIT = { name: '택배 등록하기' };

describe('ParcelRegisterPage', () => {
  it('운송장 번호를 4자리씩 띄워 보여준다', async () => {
    await render(<ParcelRegisterPage />);

    await fireEvent.changeText(screen.getByLabelText('운송장 번호 *'), '604122378890');

    expect(screen.getByDisplayValue('6041 2237 8890')).toBeOnTheScreen();
  });

  it('운송장 번호는 14자리까지만 입력된다', async () => {
    await render(<ParcelRegisterPage />);

    await fireEvent.changeText(screen.getByLabelText('운송장 번호 *'), '1234567890123456');

    expect(screen.getByDisplayValue('1234 5678 9012 34')).toBeOnTheScreen();
  });

  it('입력한 값으로 등록을 요청한다', async () => {
    const onSubmit = jest.fn();
    await render(<ParcelRegisterPage onSubmit={onSubmit} />);

    await fireEvent.changeText(screen.getByLabelText('운송장 번호 *'), '6041 2237 8890');
    await fireEvent.press(screen.getByRole('radio', { name: 'CJ대한통운' }));
    await fireEvent.changeText(screen.getByLabelText('상품명 (선택)'), ' 겨울 패딩 ');
    await fireEvent.press(screen.getByRole('button', SUBMIT));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        invoiceNumber: '604122378890',
        deliveryCompany: 'CJ대한통운',
        alias: '겨울 패딩',
      }),
    );
  });

  it('필수 값이 없으면 등록하지 않고 안내 문구를 보여준다', async () => {
    const onSubmit = jest.fn();
    await render(<ParcelRegisterPage onSubmit={onSubmit} />);

    await fireEvent.press(screen.getByRole('button', SUBMIT));

    expect(await screen.findByText('운송장 번호를 입력해 주세요.')).toBeOnTheScreen();
    expect(screen.getByText('택배사를 선택해 주세요.')).toBeOnTheScreen();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('고른 택배사만 선택 상태가 된다', async () => {
    await render(<ParcelRegisterPage />);

    await fireEvent.press(screen.getByRole('radio', { name: '한진' }));

    expect(screen.getByRole('radio', { name: '한진' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'CJ대한통운' })).not.toBeChecked();
  });
});
