import { chatKeys } from '@taekbae/api';
import type { ChatRoom, ChatRoomList } from '@taekbae/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { useChatList } from '../use-chat-list';

const room = (id: number, unreadCount: number): ChatRoom => ({
  id,
  type: 'DRIVER',
  partner: { id, name: `학생${id}`, role: 'STUDENT', studentNumber: `2061${id}` },
  lastMessage: `메시지${id}`,
  lastMessageAt: null,
  unreadCount,
  createdAt: '2026-07-06T15:00:00',
});

async function setup(data: ChatRoomList) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
  });
  // 캐시를 채워 네트워크 없이 렌더한다. 키 팩토리 사용도 함께 검증된다.
  queryClient.setQueryData(chatKeys.rooms(), data);
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(() => useChatList(), { wrapper });
}

describe('useChatList', () => {
  it('안 읽은 방은 요청, 나머지는 진행 중 요약으로 돌려준다', async () => {
    const { result, unmount } = await setup({
      totalUnreadCount: 2,
      rooms: [room(1, 0), room(2, 2)],
    });

    expect(result.current.requested.map((item) => item.id)).toEqual([2]);
    expect(result.current.active).toEqual([
      {
        id: 1,
        partnerName: '학생1',
        partnerLabel: '20611',
        lastMessage: '메시지1',
        lastMessageAt: null,
        unreadCount: 0,
      },
    ]);
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
    // 폴링 타이머가 남지 않게 정리한다.
    await unmount();
  });
});
