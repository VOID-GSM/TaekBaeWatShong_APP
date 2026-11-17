import { ApiError } from '@taekbae/api';
import type { AdminReport } from '@taekbae/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { LostReportsPage } from '../lost-reports-page';

const mockFetchAllReports = jest.fn<Promise<AdminReport[]>, []>();

jest.mock('@taekbae/api', () => ({
  ...jest.requireActual('@taekbae/api'),
  reportQueries: {
    adminList: () => ({ queryKey: ['report', 'admin-list'], queryFn: () => mockFetchAllReports() }),
  },
}));

// 캐시가 없는 첫 실행에서는 첫 렌더가 RN 모듈을 지연 로드하느라 기본 5초를 넘길 수 있다.
jest.setTimeout(10_000);

const newReport: AdminReport = {
  id: 1,
  reporterName: '김민준',
  studentNumber: '20614',
  alias: '겨울 패딩',
  invoiceNumber: '604122378890',
  deliveryCompany: 'CJ대한통운',
  lostEstimatedAt: '2026-07-06T15:30:00',
  content: '어제 오후 C구역에 도착 알림을 받았는데, 오늘 찾으러 가니 택배가 보이지 않습니다.',
  progress: 'RECEIVED',
  chatRoomId: null,
  createdAt: '2026-07-06T16:00:00',
};

const chatReport: AdminReport = {
  id: 2,
  reporterName: '이선생님',
  reporterRole: 'TEACHER',
  alias: '교재 세트',
  invoiceNumber: '772099450031',
  lostEstimatedAt: '2026-07-07T10:10:00',
  progress: 'IN_PROGRESS',
  chatRoomId: 9,
  createdAt: '2026-07-07T10:30:00',
};

async function renderPage(onOpenChat?: (report: AdminReport) => void) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <LostReportsPage onOpenChat={onOpenChat} />
    </QueryClientProvider>,
  );
}

describe('LostReportsPage', () => {
  beforeEach(() => {
    mockFetchAllReports.mockReset();
  });

  it('접수된 신고 수와 상태별 개수를 보여준다', async () => {
    mockFetchAllReports.mockResolvedValue([newReport, chatReport]);
    await renderPage();

    expect(await screen.findByText('접수된 신고 2건')).toBeOnTheScreen();
    expect(screen.getByText('신규 1')).toBeOnTheScreen();
    expect(screen.getByText('채팅 요청 1')).toBeOnTheScreen();
  });

  it('신고 카드에 신고자·운송장·분실 예상 시각·내용을 보여준다', async () => {
    mockFetchAllReports.mockResolvedValue([newReport, chatReport]);
    await renderPage();

    expect(await screen.findByText('김민준 · 20614')).toBeOnTheScreen();
    expect(screen.getByText('CJ대한통운 · 6041 2237 8890')).toBeOnTheScreen();
    expect(screen.getByText('2026.07.06 15:30')).toBeOnTheScreen();
    expect(screen.getByText(newReport.content!)).toBeOnTheScreen();
    expect(screen.getByText('이선생님 · 선생님')).toBeOnTheScreen();
  });

  it('서버가 아직 보내지 않는 값(택배사·학번·내용)이 없어도 카드를 보여준다', async () => {
    mockFetchAllReports.mockResolvedValue([
      { ...newReport, studentNumber: null, deliveryCompany: undefined, content: undefined },
    ]);
    await renderPage();

    expect(await screen.findByText('6041 2237 8890')).toBeOnTheScreen();
    expect(screen.getByText('김민준')).toBeOnTheScreen();
  });

  it('상태에 맞는 채팅 버튼을 누르면 해당 신고로 채팅을 연다', async () => {
    mockFetchAllReports.mockResolvedValue([newReport, chatReport]);
    const onOpenChat = jest.fn();
    await renderPage(onOpenChat);

    await fireEvent.press(
      await screen.findByRole('button', { name: '김민준 겨울 패딩 신고, 1:1 채팅 시작' }),
    );
    await fireEvent.press(
      screen.getByRole('button', { name: '이선생님 교재 세트 신고, 채팅방 열기' }),
    );

    expect(onOpenChat).toHaveBeenNthCalledWith(1, newReport);
    expect(onOpenChat).toHaveBeenNthCalledWith(2, chatReport);
  });

  it('처리 완료된 신고는 채팅방이 없으면 버튼을 보여주지 않는다', async () => {
    mockFetchAllReports.mockResolvedValue([{ ...newReport, progress: 'DONE' }]);
    await renderPage();

    expect(await screen.findByText('처리 완료')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /채팅/ })).toBeNull();
  });

  it('신고가 없으면 빈 목록 문구를 보여준다', async () => {
    mockFetchAllReports.mockResolvedValue([]);
    await renderPage();

    expect(await screen.findByText('접수된 분실 신고가 없어요.')).toBeOnTheScreen();
  });

  it('불러오지 못하면 에러와 다시 시도를 보여주고, 다시 시도하면 목록을 보여준다', async () => {
    mockFetchAllReports.mockRejectedValueOnce(new ApiError('네트워크 오류가 발생했습니다.'));
    mockFetchAllReports.mockResolvedValueOnce([newReport]);
    await renderPage();

    expect(await screen.findByText('분실 신고를 불러오지 못했어요.')).toBeOnTheScreen();
    expect(screen.getByText('네트워크 오류가 발생했습니다.')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: '다시 시도' }));

    expect(await screen.findByText('접수된 신고 1건')).toBeOnTheScreen();
  });
});
