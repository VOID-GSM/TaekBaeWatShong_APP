import {
  ApiError,
  CHAT_POLL_INTERVAL,
  chatQueries,
  useMarkChatRoomReadMutation,
  useSendChatMessageMutation,
} from '@taekbae/api';
import type { ChatRoom } from '@taekbae/types';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { type ChatMessageSection, groupMessagesByDate, toChatMessages } from '@/entities/chat';

const INVALID_ROOM_ERROR = new ApiError('채팅방을 찾을 수 없어요.', 404);

/** 접근할 수 없거나 없는 방(403·404)은 다시 받아도 같으므로 폴링을 멈춘다. */
function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 403 || error.status === 404);
}

export interface UseChatRoomResult {
  room: ChatRoom | undefined;
  /** 날짜별로 묶은 메시지(오래된 것 → 최신) */
  sections: ChatMessageSection[];
  /** 첫 로딩 중(데이터도 에러도 없음) */
  isPending: boolean;
  error: Error | null;
  /** 실패하면 `ApiError` 를 던진다 — 화면이 입력을 유지하고 문구를 보여 준다. */
  send: (content: string) => Promise<void>;
  isSending: boolean;
  /** 에러 화면의 "다시 시도" */
  refetch: () => void;
}

/** 학생·선생님의 1:1 채팅방. 메시지는 폴링하고, 진입·새 메시지 수신 시 읽음 처리한다. */
export function useChatRoom(roomId: number): UseChatRoomResult {
  // 잘못된 roomId(라우트가 0 으로 넘김)는 요청하지 않는다.
  const isValidRoom = Number.isInteger(roomId) && roomId > 0;
  const roomQuery = useQuery({
    ...chatQueries.room(roomId),
    enabled: isValidRoom,
    refetchInterval: (query) => (isNotFound(query.state.error) ? false : CHAT_POLL_INTERVAL.rooms),
  });
  const messagesQuery = useQuery({
    ...chatQueries.messages(roomId),
    enabled: isValidRoom,
    refetchInterval: (query) =>
      isNotFound(query.state.error) ? false : CHAT_POLL_INTERVAL.messages,
    select: (data) => toChatMessages(data.messages),
  });

  const messages = messagesQuery.data;
  const sections = useMemo(() => groupMessagesByDate(messages ?? []), [messages]);

  // 상대가 보낸 가장 최근 메시지가 바뀔 때(진입 포함)마다 한 번씩만 읽음 처리한다.
  // 요청 상태·unreadCount 에 반응하면 재조회 전까지, 또는 실패할 때마다 PATCH 가 반복된다.
  const { mutate: markRead } = useMarkChatRoomReadMutation();
  const latestIncomingId = useMemo(
    () => messages?.findLast((message) => !message.isMine)?.id,
    [messages],
  );
  const markedIdRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (latestIncomingId === undefined || markedIdRef.current === latestIncomingId) return;
    markedIdRef.current = latestIncomingId;
    markRead(roomId);
  }, [latestIncomingId, roomId, markRead]);

  const { mutateAsync: sendMessage, isPending: isSending } = useSendChatMessageMutation();
  const send = useCallback(
    async (content: string) => {
      await sendMessage({ roomId, content });
    },
    [roomId, sendMessage],
  );

  const { refetch: refetchRoom } = roomQuery;
  const { refetch: refetchMessages } = messagesQuery;
  const refetch = useCallback(() => {
    void refetchRoom();
    void refetchMessages();
  }, [refetchRoom, refetchMessages]);

  const room = roomQuery.data;
  const hasData = room !== undefined && messages !== undefined;
  // 백그라운드 재조회가 실패해도 이미 받은 데이터가 있으면 에러로 보지 않는다.
  const error = !isValidRoom
    ? INVALID_ROOM_ERROR
    : hasData
      ? null
      : (roomQuery.error ?? messagesQuery.error);

  return {
    room,
    sections,
    isPending: !hasData && error === null,
    error,
    send,
    isSending,
    refetch,
  };
}
