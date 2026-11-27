import { ApiError, CHAT_POLL_INTERVAL, chatQueries, useCreateChatRoomMutation } from '@taekbae/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { type ChatRoomSummary, toChatRoomSummary } from '@/entities/chat';

export const NO_STAFF_MESSAGE = '지금은 채팅할 수 있는 담당자가 없어요.';

export interface UseChatListResult {
  rooms: ChatRoomSummary[];
  /** 학생생활안전부(관리자)와의 방이 이미 있는지. 없으면 "문의하기"를 보여 준다. */
  hasStaffRoom: boolean;
  /** 첫 로딩 중(데이터도 에러도 없음) */
  isPending: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
  /** 학생생활안전부와의 방을 열거나 만들고 roomId 를 돌려준다. 실패하면 `ApiError` 를 던진다. */
  startStaffChat: () => Promise<number>;
  isStarting: boolean;
  startError: ApiError | null;
}

/** 학생·선생님 채팅 목록. 웹소켓이 없어 화면이 열려 있는 동안 폴링한다. */
export function useChatList(): UseChatListResult {
  const queryClient = useQueryClient();
  const { data, isPending, error, refetch, dataUpdatedAt } = useQuery({
    ...chatQueries.rooms(),
    refetchInterval: CHAT_POLL_INTERVAL.rooms,
  });

  // 상대 시각(`12분 전`)은 데이터를 다시 받을 때(폴링 주기) 함께 갱신된다.
  const rooms = useMemo(() => {
    const now = new Date(dataUpdatedAt);
    return (data?.rooms ?? []).map((room) => toChatRoomSummary(room, now));
  }, [data, dataUpdatedAt]);
  const staffRoomId = data?.rooms.find((room) => room.partner.role === 'ADMIN')?.id;

  const { mutateAsync: createRoom } = useCreateChatRoomMutation();
  const start = useMutation<number, ApiError>({
    mutationFn: async () => {
      if (staffRoomId !== undefined) return staffRoomId;
      const { partners } = await queryClient.fetchQuery(chatQueries.partners());
      const staff = partners.find((partner) => partner.role === 'ADMIN');
      if (!staff) throw new ApiError(NO_STAFF_MESSAGE);
      // 이미 방이 있으면 서버가 기존 방을 돌려준다.
      return (await createRoom(staff.id)).id;
    },
  });

  return {
    rooms,
    hasStaffRoom: staffRoomId !== undefined,
    // 백그라운드 재조회가 실패해도 기존 목록은 보여 준다 — 데이터가 있으면 에러로 보지 않는다.
    isPending: isPending && !error,
    error: data === undefined ? error : null,
    refetch,
    startStaffChat: start.mutateAsync,
    isStarting: start.isPending,
    startError: start.error,
  };
}
