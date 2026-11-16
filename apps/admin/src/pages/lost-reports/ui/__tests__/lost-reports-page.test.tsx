import { fireEvent, render, screen } from '@testing-library/react-native';

import { sampleLostReports } from '@/entities/lost-report';

import { LostReportsPage } from '../lost-reports-page';

// 캐시가 없는 첫 실행에서는 첫 렌더가 RN 모듈을 지연 로드하느라 기본 5초를 넘길 수 있다.
jest.setTimeout(10_000);

describe('LostReportsPage', () => {
  it('접수된 신고 수와 상태별 개수를 보여준다', async () => {
    await render(<LostReportsPage />);

    expect(screen.getByText('접수된 신고 2건')).toBeOnTheScreen();
    expect(screen.getByText('신규 1')).toBeOnTheScreen();
    expect(screen.getByText('채팅 요청 1')).toBeOnTheScreen();
  });

  it('신고 카드에 신고자·운송장·분실 예상 시각을 보여준다', async () => {
    await render(<LostReportsPage />);

    expect(screen.getByText('김민준 · 20614')).toBeOnTheScreen();
    expect(screen.getByText('CJ대한통운 · 6041 2237 8890')).toBeOnTheScreen();
    expect(screen.getByText('이선생님 · 선생님')).toBeOnTheScreen();
  });

  it('상태에 맞는 채팅 버튼을 누르면 해당 신고로 채팅을 연다', async () => {
    const onOpenChat = jest.fn();
    await render(<LostReportsPage onOpenChat={onOpenChat} />);

    await fireEvent.press(screen.getByRole('button', { name: '1:1 채팅 시작' }));
    await fireEvent.press(screen.getByRole('button', { name: '채팅방 열기' }));

    expect(onOpenChat).toHaveBeenNthCalledWith(1, sampleLostReports[0]);
    expect(onOpenChat).toHaveBeenNthCalledWith(2, sampleLostReports[1]);
  });
});
