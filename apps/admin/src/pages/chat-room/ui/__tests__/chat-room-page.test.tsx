import { ApiError } from '@taekbae/api';
import type { AdminReport, ChatRoom } from '@taekbae/types';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import type { UseChatRoomResult } from '../../model/use-chat-room';
import { ChatRoomPage } from '../chat-room-page';

const mockUseChatRoom = jest.fn<UseChatRoomResult, [number, number | undefined]>();

jest.mock('../../model/use-chat-room', () => ({
  useChatRoom: (roomId: number, reportId?: number) => mockUseChatRoom(roomId, reportId),
}));

// 캐시가 없는 첫 실행에서는 첫 렌더가 RN 모듈을 지연 로드하느라 기본 5초를 넘길 수 있다.
jest.setTimeout(10_000);

const room: ChatRoom = {
  id: 1,
  type: 'DRIVER',
  partner: { id: 7, name: '김민준', role: 'STUDENT', studentNumber: '20614' },
  lastMessage: '패딩이 안 보여요',
  lastMessageAt: '2026-07-06T15:31:00',
  unreadCount: 1,
  createdAt: '2026-07-06T15:30:00',
};

const report: AdminReport = {
  id: 3,
  reporterName: '김민준',
  studentNumber: '20614',
  alias: '겨울 패딩',
  invoiceNumber: '604122378890',
  lostEstimatedAt: '2026-07-06T15:30:00',
  progress: 'RECEIVED',
  chatRoomId: null,
  createdAt: '2026-07-06T16:00:00',
};

function result(overrides: Partial<UseChatRoomResult> = {}): UseChatRoomResult {
  return {
    room,
    report: undefined,
    messages: [],
    isPending: false,
    error: null,
    send: jest.fn().mockResolvedValue(undefined),
    isSending: false,
    refetch: jest.fn(),
    ...overrides,
  };
}

describe('ChatRoomPage', () => {
  it('상대 정보와 대화를 보여 주고 roomId·reportId 로 훅을 부른다', async () => {
    mockUseChatRoom.mockReturnValue(
      result({
        messages: [
          { id: 1, content: '패딩이 안 보여요', isMine: false, createdAt: new Date() },
          { id: 2, content: '확인해볼게요!', isMine: true, createdAt: new Date() },
        ],
      }),
    );

    await render(<ChatRoomPage roomId={1} reportId={3} onBack={jest.fn()} />);

    expect(mockUseChatRoom).toHaveBeenCalledWith(1, 3);
    expect(screen.getByText('김민준 · 20614')).toBeOnTheScreen();
    expect(screen.getByText('패딩이 안 보여요')).toBeOnTheScreen();
    expect(screen.getByText('확인해볼게요!')).toBeOnTheScreen();
    // 연결된 신고가 없으면 배너·부제를 숨긴다.
    expect(screen.queryByText(/분실 신고 · 예상 시각/)).toBeNull();
  });

  it('연결된 신고가 있으면 부제와 신고 배너를 보여 준다', async () => {
    mockUseChatRoom.mockReturnValue(result({ report }));

    await render(<ChatRoomPage roomId={1} onBack={jest.fn()} />);

    expect(screen.getByText('겨울 패딩 · 6041 2237 8890')).toBeOnTheScreen();
    expect(screen.getByText('분실 신고 · 예상 시각 2026.07.06 15:30')).toBeOnTheScreen();
  });

  it('메시지를 보내면 앞뒤 공백을 뗀 내용으로 send 를 부르고 입력을 비운다', async () => {
    const send = jest.fn().mockResolvedValue(undefined);
    mockUseChatRoom.mockReturnValue(result({ send }));
    await render(<ChatRoomPage roomId={1} onBack={jest.fn()} />);
    const input = screen.getByLabelText('메시지 입력');

    await fireEvent.changeText(input, '  회수 처리 부탁드려요  ');
    await fireEvent.press(screen.getByRole('button', { name: '메시지 보내기' }));

    expect(send).toHaveBeenCalledWith('회수 처리 부탁드려요');
    await waitFor(() => expect(input).toHaveDisplayValue(''));
  });

  it('공백만 입력하면 보내지 않는다', async () => {
    const send = jest.fn();
    mockUseChatRoom.mockReturnValue(result({ send }));
    await render(<ChatRoomPage roomId={1} onBack={jest.fn()} />);

    await fireEvent.changeText(screen.getByLabelText('메시지 입력'), '   ');
    await fireEvent.press(screen.getByRole('button', { name: '메시지 보내기' }));

    expect(send).not.toHaveBeenCalled();
  });

  it('전송에 실패하면 입력을 남기고 실패 문구를 보여 준다', async () => {
    const send = jest.fn().mockRejectedValue(new ApiError('네트워크 오류'));
    mockUseChatRoom.mockReturnValue(result({ send }));
    await render(<ChatRoomPage roomId={1} onBack={jest.fn()} />);
    const input = screen.getByLabelText('메시지 입력');

    await fireEvent.changeText(input, '안녕하세요');
    await fireEvent.press(screen.getByRole('button', { name: '메시지 보내기' }));

    expect(await screen.findByText('메시지를 보내지 못했어요. 네트워크 오류')).toBeOnTheScreen();
    expect(input).toHaveDisplayValue('안녕하세요');
  });

  it('뒤로가기를 누르면 onBack 을 부른다', async () => {
    const onBack = jest.fn();
    mockUseChatRoom.mockReturnValue(result());
    await render(<ChatRoomPage roomId={1} onBack={onBack} />);

    await fireEvent.press(screen.getByRole('button', { name: '뒤로가기' }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('방을 불러오는 중에는 로딩 표시를 보여 준다', async () => {
    mockUseChatRoom.mockReturnValue(result({ room: undefined, isPending: true }));

    await render(<ChatRoomPage roomId={1} onBack={jest.fn()} />);

    expect(screen.getByLabelText('대화 불러오는 중')).toBeOnTheScreen();
  });

  it('없는 채팅방이면 안내 문구를 보여 준다', async () => {
    mockUseChatRoom.mockReturnValue(
      result({ room: undefined, error: new ApiError('해당 채팅방을 찾을 수 없습니다.', 404) }),
    );

    await render(<ChatRoomPage roomId={404} onBack={jest.fn()} />);

    expect(screen.getByText('채팅방을 찾을 수 없어요.')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: '다시 시도' })).toBeNull();
  });

  it('불러오기에 실패하면 서버 메시지와 다시 시도 버튼을 보여 준다', async () => {
    const refetch = jest.fn();
    mockUseChatRoom.mockReturnValue(
      result({ room: undefined, error: new ApiError('서버 점검 중입니다.', 500), refetch }),
    );
    await render(<ChatRoomPage roomId={1} onBack={jest.fn()} />);

    expect(screen.getByText('서버 점검 중입니다.')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: '다시 시도' }));

    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
