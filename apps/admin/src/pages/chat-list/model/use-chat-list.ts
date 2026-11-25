import { CHAT_POLL_INTERVAL, chatQueries } from '@taekbae/api';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { type ChatRoomSummary, splitChatRooms, toChatRoomSummary } from '@/entities/chat';

export interface UseChatListResult {
  /** 안 읽은 메시지가 있는 방 — "채팅 요청" 섹션 */
  requested: ChatRoomSummary[];
  /** 나머지 방 — "진행 중" 섹션 */
  active: ChatRoomSummary[];
  /** 첫 로딩 중(데이터도 에러도 없음) */
  isPending: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
}

/** 관리자 1:1 채팅 목록. 웹소켓이 없어 화면이 열려 있는 동안 폴링한다. */
export function useChatList(): UseChatListResult {
  const { data, isPending, error, refetch, dataUpdatedAt } = useQuery({
    ...chatQueries.rooms(),
    refetchInterval: CHAT_POLL_INTERVAL.rooms,
  });

  // 상대 시각(`12분 전`)은 데이터를 다시 받을 때(폴링 주기) 함께 갱신된다.
  const sections = useMemo(() => {
    // 데이터가 없으면(dataUpdatedAt 0) 방도 없어 now 를 쓰지 않는다.
    const now = new Date(dataUpdatedAt);
    const { requested, active } = splitChatRooms(data?.rooms ?? []);
    return {
      requested: requested.map((room) => toChatRoomSummary(room, now)),
      active: active.map((room) => toChatRoomSummary(room, now)),
    };
  }, [data, dataUpdatedAt]);

  return {
    ...sections,
    // 백그라운드 재조회가 실패해도 기존 목록은 보여 준다 — 데이터가 있으면 에러로 보지 않는다.
    isPending: isPending && !error,
    error: data === undefined ? error : null,
    refetch,
  };
}
