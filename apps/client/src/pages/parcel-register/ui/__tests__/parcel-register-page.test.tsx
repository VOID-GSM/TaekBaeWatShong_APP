import { ApiError, useRegisterParcelMutation } from '@taekbae/api';
import type { Parcel, ParcelRegisterRequest } from '@taekbae/types';
import { QueryClient, QueryClientProvider, useMutation } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { ParcelRegisterPage } from '../parcel-register-page';

jest.mock('@taekbae/api', () => ({
  ...jest.requireActual('@taekbae/api'),
  useRegisterParcelMutation: jest.fn(),
}));

// 캐시가 없는 첫 실행에서는 첫 렌더가 RN 모듈을 지연 로드하느라 기본 5초를 넘길 수 있다.
jest.setTimeout(10_000);

const SUBMIT = { name: '택배 등록하기' };
const INVOICE = '운송장 번호, 필수';

const parcel: Parcel = {
  id: 1,
  deliveryCompany: 'CJ대한통운',
  invoiceNumber: '604122378890',
  alias: '겨울 패딩',
  status: 'PENDING',
};

/** `POST /parcel` 대신 불리는 요청. 실제 useMutation 으로 감싸서 실패·초기화 흐름까지 그대로 탄다. */
const registerParcel = jest.fn<Promise<Parcel>, [ParcelRegisterRequest]>();

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false, gcTime: Infinity } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ParcelRegisterPage />
    </QueryClientProvider>,
  );
}

async function fillRequired() {
  await fireEvent.changeText(screen.getByLabelText(INVOICE), '6041 2237 8890');
  await fireEvent.press(screen.getByRole('radio', { name: 'CJ대한통운' }));
}

describe('ParcelRegisterPage', () => {
  beforeEach(() => {
    registerParcel.mockReset();
    jest.mocked(useRegisterParcelMutation).mockImplementation(() =>
      useMutation<Parcel, ApiError, ParcelRegisterRequest>({
        mutationFn: (request) => registerParcel(request),
      }),
    );
  });

  it('운송장 번호를 4자리씩 띄워 보여준다', async () => {
    await renderPage();

    await fireEvent.changeText(screen.getByLabelText(INVOICE), '604122378890');

    expect(screen.getByDisplayValue('6041 2237 8890')).toBeOnTheScreen();
  });

  it('운송장 번호는 14자리까지만 입력된다', async () => {
    await renderPage();

    await fireEvent.changeText(screen.getByLabelText(INVOICE), '1234567890123456');

    expect(screen.getByDisplayValue('1234 5678 9012 34')).toBeOnTheScreen();
  });

  it('입력한 값으로 등록을 요청하고, 성공하면 입력을 비우고 안내한다', async () => {
    registerParcel.mockResolvedValue(parcel);
    await renderPage();

    await fillRequired();
    await fireEvent.changeText(screen.getByLabelText('상품명 (선택)'), ' 겨울 패딩 ');
    await fireEvent.press(screen.getByRole('button', SUBMIT));

    expect(await screen.findByText("'겨울 패딩' 택배를 등록했어요")).toBeOnTheScreen();
    expect(registerParcel).toHaveBeenCalledWith({
      invoiceNumber: '604122378890',
      deliveryCompany: 'CJ대한통운',
      alias: '겨울 패딩',
    });
    expect(screen.getByLabelText(INVOICE)).toHaveDisplayValue('');
    expect(screen.getByRole('radio', { name: 'CJ대한통운' })).not.toBeChecked();
  });

  it('다음 입력을 시작하면 등록 완료 안내가 사라진다', async () => {
    registerParcel.mockResolvedValue(parcel);
    await renderPage();
    await fillRequired();
    await fireEvent.press(screen.getByRole('button', SUBMIT));
    await screen.findByText("'겨울 패딩' 택배를 등록했어요");

    await fireEvent.changeText(screen.getByLabelText(INVOICE), '1');

    await waitFor(() => expect(screen.queryByText("'겨울 패딩' 택배를 등록했어요")).toBeNull());
  });

  it('상품명을 비우면 별칭 없이 보낸다', async () => {
    registerParcel.mockResolvedValue(parcel);
    await renderPage();

    await fillRequired();
    await fireEvent.press(screen.getByRole('button', SUBMIT));

    await waitFor(() =>
      expect(registerParcel).toHaveBeenCalledWith({
        invoiceNumber: '604122378890',
        deliveryCompany: 'CJ대한통운',
        alias: undefined,
      }),
    );
  });

  it('서버가 거절하면 입력을 그대로 두고 서버 문구를 보여준다', async () => {
    registerParcel.mockRejectedValue(new ApiError('이미 등록된 운송장 번호입니다.', 409));
    await renderPage();

    await fillRequired();
    await fireEvent.press(screen.getByRole('button', SUBMIT));

    expect(await screen.findByRole('alert')).toHaveTextContent('이미 등록된 운송장 번호입니다.');
    expect(screen.queryByText(/택배를 등록했어요/)).toBeNull();
    expect(screen.getByLabelText(INVOICE)).toHaveDisplayValue('6041 2237 8890');
    expect(screen.getByRole('radio', { name: 'CJ대한통운' })).toBeChecked();
  });

  it('필수 값이 없으면 등록하지 않고 안내 문구를 보여준다', async () => {
    await renderPage();

    await fireEvent.press(screen.getByRole('button', SUBMIT));

    expect(await screen.findByText('운송장 번호를 입력해 주세요.')).toBeOnTheScreen();
    expect(screen.getByText('택배사를 선택해 주세요.')).toBeOnTheScreen();
    expect(registerParcel).not.toHaveBeenCalled();
  });

  it('고른 택배사만 선택 상태가 된다', async () => {
    await renderPage();

    await fireEvent.press(screen.getByRole('radio', { name: '한진' }));

    expect(screen.getByRole('radio', { name: '한진' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'CJ대한통운' })).not.toBeChecked();
  });
});
