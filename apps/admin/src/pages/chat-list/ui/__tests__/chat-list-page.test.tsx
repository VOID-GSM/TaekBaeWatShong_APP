import { fireEvent, render, screen } from '@testing-library/react-native';

import type { ChatRoomSummary } from '@/entities/chat';

import type { UseChatListResult } from '../../model/use-chat-list';
import { ChatListPage } from '../chat-list-page';

const mockUseChatList = jest.fn<UseChatListResult, []>();

jest.mock('../../model/use-chat-list', () => ({
  useChatList: () => mockUseChatList(),
}));

// 캐시가 없는 첫 실행에서는 첫 렌더가 RN 모듈을 지연 로드하느라 기본 5초를 넘길 수 있다.
jest.setTimeout(10_000);

const student: ChatRoomSummary = {
  id: 1,
  partnerName: '김민준',
  partnerLabel: '20614',
  lastMessage: '겨울 패딩 택배가 C구역에 안 보여요',
  lastMessageAt: '방금 전',
  unreadCount: 2,
};

const teacher: ChatRoomSummary = {
  id: 2,
  partnerName: '이선생님',
  partnerLabel: '선생님',
  lastMessage: '감사합니다',
  lastMessageAt: '어제',
  unreadCount: 0,
};

function result(overrides: Partial<UseChatListResult> = {}): UseChatListResult {
  return {
    requested: [],
    active: [],
    isPending: false,
    error: null,
    refetch: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('ChatListPage', () => {
  it('채팅 요청과 진행 중 섹션을 나눠 보여 준다', async () => {
    mockUseChatList.mockReturnValue(result({ requested: [student], active: [teacher] }));

    await render(<ChatListPage onOpenRoom={jest.fn()} />);

    expect(screen.getByText('1:1 채팅')).toBeOnTheScreen();
    expect(screen.getByText('채팅 요청')).toBeOnTheScreen();
    expect(screen.getByLabelText('채팅 요청 1건')).toBeOnTheScreen();
    expect(screen.getByText('김민준 · 20614')).toBeOnTheScreen();
    expect(screen.getByText('2')).toBeOnTheScreen();
    expect(screen.getByText('진행 중')).toBeOnTheScreen();
    expect(screen.getByText('이선생님 · 선생님')).toBeOnTheScreen();
    expect(screen.getByText('어제')).toBeOnTheScreen();
  });

  it('카드를 누르면 그 방 id 로 onOpenRoom 을 부른다', async () => {
    const onOpenRoom = jest.fn();
    mockUseChatList.mockReturnValue(result({ active: [teacher] }));
    await render(<ChatListPage onOpenRoom={onOpenRoom} />);

    await fireEvent.press(screen.getByText('이선생님 · 선생님'));

    expect(onOpenRoom).toHaveBeenCalledWith(2);
  });

  it('요청이 없으면 채팅 요청 섹션을 숨긴다', async () => {
    mockUseChatList.mockReturnValue(result({ active: [teacher] }));

    await render(<ChatListPage onOpenRoom={jest.fn()} />);

    expect(screen.getByText('진행 중')).toBeOnTheScreen();
    expect(screen.queryByText('채팅 요청')).toBeNull();
  });

  it('메시지가 없는 방은 안내 문구를 보여 주고 시각을 숨긴다', async () => {
    mockUseChatList.mockReturnValue(
      result({ active: [{ ...teacher, lastMessage: '', lastMessageAt: null }] }),
    );

    await render(<ChatListPage onOpenRoom={jest.fn()} />);

    expect(screen.getByText('아직 메시지가 없어요')).toBeOnTheScreen();
    expect(screen.queryByText('어제')).toBeNull();
  });

  it('채팅이 하나도 없으면 빈 상태 문구를 보여 준다', async () => {
    mockUseChatList.mockReturnValue(result());

    await render(<ChatListPage onOpenRoom={jest.fn()} />);

    expect(screen.getByText('아직 채팅이 없어요')).toBeOnTheScreen();
  });

  it('불러오는 중에는 로딩 표시를 보여 준다', async () => {
    mockUseChatList.mockReturnValue(result({ isPending: true }));

    await render(<ChatListPage onOpenRoom={jest.fn()} />);

    expect(screen.getByLabelText('채팅 목록 불러오는 중')).toBeOnTheScreen();
  });

  it('불러오기에 실패하면 서버 메시지와 다시 시도 버튼을 보여 준다', async () => {
    const refetch = jest.fn().mockResolvedValue(undefined);
    mockUseChatList.mockReturnValue(result({ error: new Error('서버 점검 중입니다.'), refetch }));
    await render(<ChatListPage onOpenRoom={jest.fn()} />);

    expect(screen.getByText('서버 점검 중입니다.')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: '다시 시도' }));

    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
