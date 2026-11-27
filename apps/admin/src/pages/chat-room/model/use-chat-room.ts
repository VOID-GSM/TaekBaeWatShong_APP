import {
  ApiError,
  CHAT_POLL_INTERVAL,
  chatQueries,
  reportQueries,
  useMarkChatRoomReadMutation,
  useSendChatMessageMutation,
} from '@taekbae/api';
import type { ChatRoom } from '@taekbae/types';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { type ChatBubbleMessage, toChatMessages } from '@/entities/chat';
import type { LostReport } from '@/entities/lost-report';

const INVALID_ROOM_ERROR = new ApiError('채팅방을 찾을 수 없어요.', 404);

/** 접근할 수 없거나 없는 방(403·404)은 다시 받아도 같으므로 폴링을 멈춘다. */
function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 403 || error.status === 404);
}

/**
 * 채팅방에 연결할 분실 신고를 고른다.
 * 1. `reportId` 가 있으면 그 신고(신고 목록에서 채팅을 시작한 경우)
 * 2. 채팅방이 `chatRoomId` 로 연결된 신고
 * 3. 상대 학번과 같은 학번의 처리 완료가 아닌 신고 중 가장 최근 것
 */
export function findChatReport(
  reports: readonly LostReport[],
  room: Pick<ChatRoom, 'id' | 'partner'> | undefined,
  reportId?: number,
): LostReport | undefined {
  if (reportId !== undefined) {
    const byId = reports.find((report) => report.id === reportId);
    if (byId) return byId;
  }
  if (!room) return undefined;

  const byRoom = reports.find((report) => report.chatRoomId === room.id);
  if (byRoom) return byRoom;

  const studentNumber = room.partner.studentNumber;
  if (!studentNumber) return undefined;
  return reports
    .filter((report) => report.studentNumber === studentNumber && report.progress !== 'DONE')
    .reduce<LostReport | undefined>(
      (latest, report) => (latest && latest.createdAt >= report.createdAt ? latest : report),
      undefined,
    );
}

export interface UseChatRoomResult {
  room: ChatRoom | undefined;
  /** 배너에 보일 분실 신고. 찾지 못하면 배너를 숨긴다. */
  report: LostReport | undefined;
  /** 오래된 것 → 최신 */
  messages: ChatBubbleMessage[];
  /** 첫 로딩 중(데이터도 에러도 없음) */
  isPending: boolean;
  /** 방·메시지를 불러오지 못한 에러. 신고 목록 에러는 배너만 숨기므로 포함하지 않는다. */
  error: Error | null;
  /** 실패하면 `ApiError` 를 던진다 — 화면이 입력을 유지하고 문구를 보여 준다. */
  send: (content: string) => Promise<void>;
  isSending: boolean;
  /** 에러 화면의 "다시 시도" */
  refetch: () => void;
}

/** 관리자 채팅방. 메시지는 폴링하고, 진입·새 메시지 수신 시 읽음 처리한다. */
export function useChatRoom(roomId: number, reportId?: number): UseChatRoomResult {
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
  const reportsQuery = useQuery(reportQueries.adminList());

  const room = roomQuery.data;
  const report = useMemo(
    () => findChatReport(reportsQuery.data ?? [], room, reportId),
    [reportsQuery.data, room, reportId],
  );

  // 상대가 보낸 가장 최근 메시지가 바뀔 때(진입 포함)마다 한 번씩 읽음 처리한다.
  const { mutate: markRead } = useMarkChatRoomReadMutation();
  const messages = messagesQuery.data;
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

  const hasData = room !== undefined && messages !== undefined;
  const error = !isValidRoom
    ? INVALID_ROOM_ERROR
    : hasData
      ? null
      : (roomQuery.error ?? messagesQuery.error);

  return {
    room,
    report,
    messages: messages ?? [],
    isPending: !hasData && error === null,
    error,
    send,
    isSending,
    refetch,
  };
}
