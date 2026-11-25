import { ApiError } from '@taekbae/api';
import type { ChatPartner } from '@taekbae/types';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import type { UseStaffChatResult } from '../../model/use-staff-chat';
import { ChatPage } from '../chat-page';

const mockUseStaffChat = jest.fn<UseStaffChatResult, []>();

jest.mock('../../model/use-staff-chat', () => ({
  NO_STAFF_MESSAGE: '지금은 채팅할 수 있는 담당자가 없어요.',
  useStaffChat: () => mockUseStaffChat(),
}));

// 캐시가 없는 첫 실행에서는 첫 렌더가 RN 모듈을 지연 로드하느라 기본 5초를 넘길 수 있다.
jest.setTimeout(10_000);

const admin: ChatPartner = { id: 2, name: '택배 관리자', role: 'ADMIN', studentNumber: null };

function result(overrides: Partial<UseStaffChatResult> = {}): UseStaffChatResult {
  return {
    partner: admin,
    sections: [],
    isPending: false,
    error: null,
    send: jest.fn().mockResolvedValue(undefined),
    isSending: false,
    refetch: jest.fn(),
    ...overrides,
  };
}

describe('ChatPage', () => {
  it('고정 헤더와 날짜별 대화를 보여 준다', async () => {
    mockUseStaffChat.mockReturnValue(
      result({
        sections: [
          {
            date: '2026년 7월 6일',
            messages: [
              { id: 1, content: '패딩이 안 보여요', isMine: true, createdAt: new Date() },
              { id: 2, content: 'D구역으로 옮겨두었습니다', isMine: false, createdAt: new Date() },
            ],
          },
        ],
      }),
    );

    await render(<ChatPage />);

    expect(screen.getByText('학생생활안전부')).toBeOnTheScreen();
    // 접속 상태 API 가 없어 온라인 표시는 그리지 않는다.
    expect(screen.queryByText('● 온라인')).toBeNull();
    expect(screen.getByText('2026년 7월 6일')).toBeOnTheScreen();
    expect(screen.getByText('패딩이 안 보여요')).toBeOnTheScreen();
    expect(screen.getByText('D구역으로 옮겨두었습니다')).toBeOnTheScreen();
  });

  it('대화가 없으면 안내 문구를 보여 준다', async () => {
    mockUseStaffChat.mockReturnValue(result());

    await render(<ChatPage />);

    expect(screen.getByText('궁금한 점을 남겨 주세요')).toBeOnTheScreen();
    expect(screen.getByLabelText('메시지 입력')).toBeEnabled();
  });

  it('메시지를 보내면 앞뒤 공백을 뗀 내용으로 send 를 부르고 입력을 비운다', async () => {
    const send = jest.fn().mockResolvedValue(undefined);
    mockUseStaffChat.mockReturnValue(result({ send }));
    await render(<ChatPage />);
    const input = screen.getByLabelText('메시지 입력');

    await fireEvent.changeText(input, '  감사합니다!  ');
    await fireEvent.press(screen.getByRole('button', { name: '메시지 보내기' }));

    expect(send).toHaveBeenCalledWith('감사합니다!');
    await waitFor(() => expect(input).toHaveDisplayValue(''));
  });

  it('전송에 실패하면 입력을 남기고 실패 문구를 보여 준다', async () => {
    const send = jest.fn().mockRejectedValue(new ApiError('네트워크 오류'));
    mockUseStaffChat.mockReturnValue(result({ send }));
    await render(<ChatPage />);
    const input = screen.getByLabelText('메시지 입력');

    await fireEvent.changeText(input, '안녕하세요');
    await fireEvent.press(screen.getByRole('button', { name: '메시지 보내기' }));

    expect(await screen.findByText('메시지를 보내지 못했어요. 네트워크 오류')).toBeOnTheScreen();
    expect(input).toHaveDisplayValue('안녕하세요');
  });

  it('채팅할 관리자가 없으면 안내하고 입력을 막는다', async () => {
    mockUseStaffChat.mockReturnValue(result({ partner: null }));

    await render(<ChatPage />);

    expect(screen.getByText('지금은 채팅할 수 있는 담당자가 없어요.')).toBeOnTheScreen();
    expect(screen.getByLabelText('메시지 입력')).toBeDisabled();
  });

  it('불러오는 중에는 로딩 표시를 보여 주고 입력을 막는다', async () => {
    mockUseStaffChat.mockReturnValue(result({ isPending: true, partner: null }));

    await render(<ChatPage />);

    expect(screen.getByLabelText('대화 불러오는 중')).toBeOnTheScreen();
    expect(screen.getByLabelText('메시지 입력')).toBeDisabled();
  });

  it('불러오기에 실패하면 서버 메시지와 다시 시도 버튼을 보여 준다', async () => {
    const refetch = jest.fn();
    mockUseStaffChat.mockReturnValue(
      result({ error: new ApiError('서버 점검 중입니다.', 500), refetch }),
    );
    await render(<ChatPage />);

    expect(screen.getByText('서버 점검 중입니다.')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: '다시 시도' }));

    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
