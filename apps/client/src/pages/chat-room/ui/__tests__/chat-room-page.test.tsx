import { ApiError } from '@taekbae/api';
import type { ChatRoom } from '@taekbae/types';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import type { UseChatRoomResult } from '../../model/use-chat-room';
import { ChatRoomPage } from '../chat-room-page';

const mockUseChatRoom = jest.fn<UseChatRoomResult, [number]>();

jest.mock('../../model/use-chat-room', () => ({
  useChatRoom: (roomId: number) => mockUseChatRoom(roomId),
}));

// 캐시가 없는 첫 실행에서는 첫 렌더가 RN 모듈을 지연 로드하느라 기본 5초를 넘길 수 있다.
jest.setTimeout(10_000);

const staffRoom: ChatRoom = {
  id: 7,
  type: 'DRIVER',
  partner: { id: 2, name: '택배 관리자', role: 'ADMIN', studentNumber: null },
  lastMessage: null,
  lastMessageAt: null,
  unreadCount: 0,
  createdAt: '2026-07-06T15:00:00',
};

function result(overrides: Partial<UseChatRoomResult> = {}): UseChatRoomResult {
  return {
    room: staffRoom,
    sections: [],
    isPending: false,
    error: null,
    send: jest.fn().mockResolvedValue(undefined),
    isSending: false,
    refetch: jest.fn(),
    ...overrides,
  };
}

const onBack = jest.fn();

beforeEach(() => onBack.mockClear());

describe('ChatRoomPage', () => {
  it('선생님과의 방은 이름과 역할을 보여 주고, 뒤로가기를 누르면 onBack 을 부른다', async () => {
    mockUseChatRoom.mockReturnValue(
      result({
        room: {
          ...staffRoom,
          type: 'CLIENT',
          partner: { id: 5, name: '이선생', role: 'TEACHER', studentNumber: null },
        },
      }),
    );
    await render(<ChatRoomPage roomId={7} onBack={onBack} />);

    expect(mockUseChatRoom).toHaveBeenCalledWith(7);
    expect(screen.getByText('이선생 · 선생님')).toBeOnTheScreen();
    expect(screen.getByText('아직 주고받은 메시지가 없어요')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: '뒤로 가기' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('관리자와의 방은 학생생활안전부로 보여 주고 날짜별 대화를 보여 준다', async () => {
    mockUseChatRoom.mockReturnValue(
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

    await render(<ChatRoomPage roomId={7} onBack={onBack} />);

    expect(screen.getByText('학생생활안전부')).toBeOnTheScreen();
    // 접속 상태 API 가 없어 온라인 표시는 그리지 않는다.
    expect(screen.queryByText('● 온라인')).toBeNull();
    expect(screen.getByText('2026년 7월 6일')).toBeOnTheScreen();
    expect(screen.getByText('패딩이 안 보여요')).toBeOnTheScreen();
    expect(screen.getByText('D구역으로 옮겨두었습니다')).toBeOnTheScreen();
  });

  it('대화가 없으면 안내 문구를 보여 준다', async () => {
    mockUseChatRoom.mockReturnValue(result());

    await render(<ChatRoomPage roomId={7} onBack={onBack} />);

    expect(screen.getByText('궁금한 점을 남겨 주세요')).toBeOnTheScreen();
    expect(screen.getByLabelText('메시지 입력')).toBeEnabled();
  });

  it('메시지를 보내면 앞뒤 공백을 뗀 내용으로 send 를 부르고 입력을 비운다', async () => {
    const send = jest.fn().mockResolvedValue(undefined);
    mockUseChatRoom.mockReturnValue(result({ send }));
    await render(<ChatRoomPage roomId={7} onBack={onBack} />);
    const input = screen.getByLabelText('메시지 입력');

    await fireEvent.changeText(input, '  감사합니다!  ');
    await fireEvent.press(screen.getByRole('button', { name: '메시지 보내기' }));

    expect(send).toHaveBeenCalledWith('감사합니다!');
    await waitFor(() => expect(input).toHaveDisplayValue(''));
  });

  it('전송에 실패하면 입력을 남기고 실패 문구를 보여 준다', async () => {
    const send = jest.fn().mockRejectedValue(new ApiError('네트워크 오류'));
    mockUseChatRoom.mockReturnValue(result({ send }));
    await render(<ChatRoomPage roomId={7} onBack={onBack} />);
    const input = screen.getByLabelText('메시지 입력');

    await fireEvent.changeText(input, '안녕하세요');
    await fireEvent.press(screen.getByRole('button', { name: '메시지 보내기' }));

    expect(await screen.findByText('메시지를 보내지 못했어요. 네트워크 오류')).toBeOnTheScreen();
    expect(input).toHaveDisplayValue('안녕하세요');
  });

  it('불러오는 중에는 로딩 표시를 보여 주고 입력을 막는다', async () => {
    mockUseChatRoom.mockReturnValue(result({ isPending: true, room: undefined }));

    await render(<ChatRoomPage roomId={7} onBack={onBack} />);

    expect(screen.getByLabelText('대화 불러오는 중')).toBeOnTheScreen();
    expect(screen.getByLabelText('메시지 입력')).toBeDisabled();
  });

  it('불러오기에 실패하면 서버 메시지와 다시 시도 버튼을 보여 준다', async () => {
    const refetch = jest.fn();
    mockUseChatRoom.mockReturnValue(
      result({ error: new ApiError('서버 점검 중입니다.', 500), refetch }),
    );
    await render(<ChatRoomPage roomId={7} onBack={onBack} />);

    expect(screen.getByText('서버 점검 중입니다.')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: '다시 시도' }));

    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
