import { ApiError } from '@taekbae/api';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import type { ChatRoomSummary } from '@/entities/chat';

import type { UseChatListResult } from '../../model/use-chat-list';
import { ChatListPage } from '../chat-list-page';

const mockUseChatList = jest.fn<UseChatListResult, []>();

jest.mock('../../model/use-chat-list', () => ({
  useChatList: () => mockUseChatList(),
}));

// 캐시가 없는 첫 실행에서는 첫 렌더가 RN 모듈을 지연 로드하느라 기본 5초를 넘길 수 있다.
jest.setTimeout(10_000);

const staffRoom: ChatRoomSummary = {
  id: 7,
  isStaff: true,
  partnerName: '학생생활안전부',
  partnerLabel: '',
  lastMessage: 'D구역으로 옮겨두었습니다',
  lastMessageAt: '방금 전',
  unreadCount: 2,
};

function result(overrides: Partial<UseChatListResult> = {}): UseChatListResult {
  return {
    rooms: [staffRoom],
    hasStaffRoom: true,
    isPending: false,
    error: null,
    refetch: jest.fn().mockResolvedValue(undefined),
    startStaffChat: jest.fn().mockResolvedValue(7),
    isStarting: false,
    startError: null,
    ...overrides,
  };
}

const onOpenRoom = jest.fn();

beforeEach(() => onOpenRoom.mockClear());

describe('ChatListPage', () => {
  it('채팅방 목록을 보여 주고 누르면 그 방을 연다', async () => {
    mockUseChatList.mockReturnValue(result());
    await render(<ChatListPage onOpenRoom={onOpenRoom} />);

    expect(screen.getByText('채팅')).toBeOnTheScreen();
    expect(screen.getByText('D구역으로 옮겨두었습니다')).toBeOnTheScreen();
    expect(screen.getByText('2')).toBeOnTheScreen();
    // 이미 방이 있으면 문의하기 버튼은 숨긴다.
    expect(screen.queryByText('학생생활안전부에 문의하기')).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: /학생생활안전부/ }));
    expect(onOpenRoom).toHaveBeenCalledWith(7);
  });

  it('학생생활안전부와의 방이 없으면 문의하기로 방을 만들고 연다', async () => {
    const startStaffChat = jest.fn().mockResolvedValue(11);
    mockUseChatList.mockReturnValue(result({ rooms: [], hasStaffRoom: false, startStaffChat }));
    await render(<ChatListPage onOpenRoom={onOpenRoom} />);

    expect(screen.getByText('아직 채팅이 없어요')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: '학생생활안전부에 문의하기' }));

    expect(startStaffChat).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(onOpenRoom).toHaveBeenCalledWith(11));
  });

  it('문의하기에 실패하면 문구를 보여 주고 이동하지 않는다', async () => {
    mockUseChatList.mockReturnValue(
      result({
        rooms: [],
        hasStaffRoom: false,
        startStaffChat: jest.fn().mockRejectedValue(new ApiError('담당자 없음')),
        startError: new ApiError('지금은 채팅할 수 있는 담당자가 없어요.'),
      }),
    );
    await render(<ChatListPage onOpenRoom={onOpenRoom} />);

    expect(screen.getByText('지금은 채팅할 수 있는 담당자가 없어요.')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: '학생생활안전부에 문의하기' }));
    expect(onOpenRoom).not.toHaveBeenCalled();
  });

  it('불러오기에 실패하면 서버 메시지와 다시 시도 버튼을 보여 준다', async () => {
    const refetch = jest.fn().mockResolvedValue(undefined);
    mockUseChatList.mockReturnValue(
      result({ rooms: [], error: new ApiError('서버 점검 중입니다.', 500), refetch }),
    );
    await render(<ChatListPage onOpenRoom={onOpenRoom} />);

    expect(screen.getByText('서버 점검 중입니다.')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: '다시 시도' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
