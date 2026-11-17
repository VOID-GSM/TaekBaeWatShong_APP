import { ApiError } from '@taekbae/api';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { useForm } from 'react-hook-form';

import { useMyParcel, type UseMyParcelResult } from '@/entities/parcel';
import {
  type ReportLostParcelFormValues,
  useReportLostParcelForm,
  type UseReportLostParcelFormResult,
} from '@/features/report-lost-parcel';

import { ReportLostParcelPage } from '../report-lost-parcel-page';

jest.mock('expo-router', () => {
  const router = { back: jest.fn(), replace: jest.fn(), push: jest.fn(), canGoBack: jest.fn() };
  return { useRouter: () => router, router };
});

jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return {
    SafeAreaView: View,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('@/entities/parcel', () => ({
  ParcelInfoCard: jest.requireActual('@/entities/parcel/ui/parcel-info-card').ParcelInfoCard,
  useMyParcel: jest.fn(),
}));

jest.mock('@/features/report-lost-parcel', () => ({
  ReportLostParcelForm: jest.requireActual(
    '@/features/report-lost-parcel/ui/report-lost-parcel-form',
  ).ReportLostParcelForm,
  useReportLostParcelForm: jest.fn(),
}));

jest.setTimeout(10_000);

const { router } = jest.requireMock<{
  router: { back: jest.Mock; replace: jest.Mock; canGoBack: jest.Mock };
}>('expo-router');
const submit = jest.fn();

const PARCEL: NonNullable<UseMyParcelResult['parcel']> = {
  id: 1,
  deliveryCompany: 'CJ대한통운',
  invoiceNumber: '604122378890',
  alias: '겨울 패딩',
  status: 'ARRIVED',
  unclaimedDays: 1,
  createdAt: '2026-07-05T10:00:00',
};

function mockParcel(result: Partial<UseMyParcelResult>) {
  jest.mocked(useMyParcel).mockReturnValue({
    parcel: undefined,
    isPending: false,
    error: null,
    refetch: jest.fn(),
    ...result,
  });
}

function mockForm(result: Partial<UseReportLostParcelFormResult> = {}) {
  // 훅 규칙상 이름이 use 로 시작하는 함수 안에서 useForm 을 부른다.
  function useFakeReportForm(): UseReportLostParcelFormResult {
    const { control } = useForm<ReportLostParcelFormValues>({
      defaultValues: { lostEstimatedAt: '2026. 07. 06 15:30', content: '' },
    });
    return { control, submit, isSubmitting: false, submitError: null, ...result };
  }
  jest.mocked(useReportLostParcelForm).mockImplementation(useFakeReportForm);
}

describe('ReportLostParcelPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    router.canGoBack.mockReturnValue(true);
    mockForm();
  });

  it('신고 대상 택배와 입력 폼, 하단 버튼을 보여준다', async () => {
    mockParcel({ parcel: PARCEL });
    await render(<ReportLostParcelPage invoiceNumber="604122378890" />);

    expect(screen.getByRole('header', { name: '분실 신고' })).toBeOnTheScreen();
    expect(screen.getByText('겨울 패딩')).toBeOnTheScreen();
    expect(screen.getByText('CJ대한통운 · 6041 2237 8890')).toBeOnTheScreen();
    expect(screen.getByText('분실 예상 시각')).toBeOnTheScreen();
    expect(screen.getByLabelText('상세 내용')).toBeOnTheScreen();
    expect(useMyParcel).toHaveBeenCalledWith('604122378890');
    expect(useReportLostParcelForm).toHaveBeenCalledWith(
      expect.objectContaining({ invoiceNumber: '604122378890' }),
    );
  });

  it('제출 버튼을 누르면 폼을 제출한다', async () => {
    mockParcel({ parcel: PARCEL });
    await render(<ReportLostParcelPage invoiceNumber="604122378890" />);

    await fireEvent.press(screen.getByRole('button', { name: '분실 신고 제출' }));

    expect(submit).toHaveBeenCalledTimes(1);
  });

  it('제출 중에는 제출 버튼이 비활성화된다', async () => {
    mockParcel({ parcel: PARCEL });
    mockForm({ isSubmitting: true });
    await render(<ReportLostParcelPage invoiceNumber="604122378890" />);

    const button = screen.getByRole('button', { name: '분실 신고 제출' });
    expect(button).toBeDisabled();
    expect(button).toBeBusy();
  });

  it('제출이 실패하면 서버 문구를 보여준다', async () => {
    mockParcel({ parcel: PARCEL });
    mockForm({ submitError: '이미 신고된 택배입니다.' });
    await render(<ReportLostParcelPage invoiceNumber="604122378890" />);

    expect(screen.getByRole('alert')).toHaveTextContent('이미 신고된 택배입니다.');
  });

  it('취소를 누르면 이전 화면으로 돌아간다', async () => {
    mockParcel({ parcel: PARCEL });
    await render(<ReportLostParcelPage invoiceNumber="604122378890" />);

    await fireEvent.press(screen.getByRole('button', { name: '취소' }));

    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('돌아갈 화면이 없으면 홈으로 보낸다', async () => {
    mockParcel({ parcel: PARCEL });
    router.canGoBack.mockReturnValue(false);
    await render(<ReportLostParcelPage invoiceNumber="604122378890" />);

    await fireEvent.press(screen.getByRole('button', { name: '뒤로 가기' }));

    expect(router.replace).toHaveBeenCalledWith('/');
  });

  it('불러오는 중에는 인디케이터만 보여준다', async () => {
    mockParcel({ isPending: true });
    await render(<ReportLostParcelPage invoiceNumber="604122378890" />);

    expect(screen.getByLabelText('택배 정보를 불러오는 중')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: '분실 신고 제출' })).toBeNull();
  });

  it('내 택배에 없으면 안내 문구를 보여준다', async () => {
    mockParcel({ parcel: undefined });
    await render(<ReportLostParcelPage invoiceNumber="000000000000" />);

    expect(screen.getByRole('alert')).toHaveTextContent('신고할 택배를 찾을 수 없어요.');
    expect(screen.queryByRole('button', { name: '분실 신고 제출' })).toBeNull();
  });

  it('불러오기에 실패하면 다시 시도할 수 있다', async () => {
    const refetch = jest.fn();
    mockParcel({ error: new ApiError('네트워크 연결을 확인해 주세요.'), refetch });
    await render(<ReportLostParcelPage invoiceNumber="604122378890" />);

    expect(screen.getByRole('alert')).toHaveTextContent('택배 정보를 불러오지 못했어요.');
    await fireEvent.press(screen.getByRole('button', { name: '다시 시도' }));

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('재조회가 실패해도 이미 받은 택배가 있으면 폼을 유지한다', async () => {
    mockParcel({ parcel: PARCEL, error: new ApiError('네트워크 연결을 확인해 주세요.') });
    await render(<ReportLostParcelPage invoiceNumber="604122378890" />);

    expect(screen.getByRole('button', { name: '분실 신고 제출' })).toBeOnTheScreen();
    expect(screen.queryByText('택배 정보를 불러오지 못했어요.')).toBeNull();
  });
});
