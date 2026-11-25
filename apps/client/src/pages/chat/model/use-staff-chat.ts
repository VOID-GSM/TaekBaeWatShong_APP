import {
  ApiError,
  CHAT_POLL_INTERVAL,
  chatQueries,
  useCreateChatRoomMutation,
  useMarkChatRoomReadMutation,
  useSendChatMessageMutation,
} from '@taekbae/api';
import type { ChatPartner } from '@taekbae/types';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { type ChatMessageSection, groupMessagesByDate, toChatMessages } from '@/entities/chat';

export const NO_STAFF_MESSAGE = '지금은 채팅할 수 있는 담당자가 없어요.';

export interface UseStaffChatResult {
  /** 관리자. 방도 없고 채팅할 수 있는 관리자도 없으면 `null`. */
  partner: ChatPartner | null;
  /** 날짜별로 묶은 메시지(오래된 것 → 최신). 방이 없으면 빈 배열. */
  sections: ChatMessageSection[];
  /** 첫 로딩 중(데이터도 에러도 없음) */
  isPending: boolean;
  error: Error | null;
  /** 방이 없으면 관리자와 방을 만든 뒤 보낸다. 실패하면 `ApiError` 를 던진다. */
  send: (content: string) => Promise<void>;
  isSending: boolean;
  /** 에러 화면의 "다시 시도" */
  refetch: () => void;
}

/**
 * 학생·선생님과 관리자(ADMIN) 사이의 1:1 채팅. 관리자와의 방은 하나다.
 * 방이 있으면 그 방을 쓰고, 없으면 첫 메시지를 보낼 때 채팅 상대 중 관리자와 방을 만든다.
 */
export function useStaffChat(): UseStaffChatResult {
  const roomsQuery = useQuery({
    ...chatQueries.rooms(),
    refetchInterval: CHAT_POLL_INTERVAL.rooms,
  });
  const room = roomsQuery.data?.rooms.find((item) => item.partner.role === 'ADMIN') ?? null;

  const partnersQuery = useQuery({
    ...chatQueries.partners(),
    enabled: roomsQuery.isSuccess && room === null,
  });
  const partner =
    room?.partner ?? partnersQuery.data?.partners.find((item) => item.role === 'ADMIN') ?? null;

  const messagesQuery = useQuery({
    ...chatQueries.messages(room?.id ?? 0),
    enabled: room !== null,
    refetchInterval: CHAT_POLL_INTERVAL.messages,
    select: (data) => toChatMessages(data.messages),
  });
  const sections = useMemo(
    () => groupMessagesByDate(messagesQuery.data ?? []),
    [messagesQuery.data],
  );

  // 상대가 보낸 가장 최근 메시지가 바뀔 때(진입 포함)마다 한 번씩만 읽음 처리한다.
  // 요청 상태·unreadCount 에 반응하면 재조회 전까지, 또는 실패할 때마다 PATCH 가 반복된다.
  const roomId = room?.id;
  const { mutate: markRead } = useMarkChatRoomReadMutation();
  const latestIncomingId = useMemo(
    () => messagesQuery.data?.findLast((message) => !message.isMine)?.id,
    [messagesQuery.data],
  );
  const markedIdRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (roomId === undefined || latestIncomingId === undefined) return;
    if (markedIdRef.current === latestIncomingId) return;
    markedIdRef.current = latestIncomingId;
    markRead(roomId);
  }, [roomId, latestIncomingId, markRead]);

  const createRoom = useCreateChatRoomMutation();
  const sendMessage = useSendChatMessageMutation();
  const { mutateAsync: createRoomAsync } = createRoom;
  const { mutateAsync: sendMessageAsync } = sendMessage;
  const partnerId = partner?.id;
  const send = useCallback(
    async (content: string) => {
      let targetRoomId = roomId;
      if (targetRoomId === undefined) {
        if (partnerId === undefined) throw new ApiError(NO_STAFF_MESSAGE);
        targetRoomId = (await createRoomAsync(partnerId)).id;
      }
      await sendMessageAsync({ roomId: targetRoomId, content });
    },
    [roomId, partnerId, createRoomAsync, sendMessageAsync],
  );

  const { refetch: refetchRooms } = roomsQuery;
  const { refetch: refetchPartners } = partnersQuery;
  const { refetch: refetchMessages } = messagesQuery;
  const hasRoom = room !== null;
  const refetch = useCallback(() => {
    void refetchRooms();
    // 꺼 둔 쿼리의 refetch 는 enabled 를 무시하고 요청하므로, 지금 필요한 쿼리만 다시 받는다.
    void (hasRoom ? refetchMessages() : refetchPartners());
  }, [hasRoom, refetchRooms, refetchMessages, refetchPartners]);

  // 꺼 둔(enabled: false) 쿼리도 isPending 이라, 방 유무에 따라 실제로 기다리는 쿼리만 본다.
  const dependent = room === null ? partnersQuery : messagesQuery;
  // 백그라운드 재조회가 실패해도 이미 받은 데이터가 있으면 에러로 보지 않는다.
  const error =
    roomsQuery.data === undefined
      ? roomsQuery.error
      : dependent.data === undefined
        ? dependent.error
        : null;
  const isPending = error === null && (roomsQuery.isPending || dependent.isPending);

  return {
    partner,
    sections,
    isPending,
    error,
    send,
    isSending: createRoom.isPending || sendMessage.isPending,
    refetch,
  };
}
