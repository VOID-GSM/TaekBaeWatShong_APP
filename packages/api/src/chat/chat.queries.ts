import type { ChatMessage, ChatPartnerListParams, ChatReadResult, ChatRoom } from '@taekbae/types';
import {
  queryOptions,
  useMutation,
  type UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';

import type { ApiError } from '../client';
import { reportKeys } from '../report/report.keys';
import {
  createChatRoom,
  fetchChatMessages,
  fetchChatPartners,
  fetchChatRoom,
  fetchChatRooms,
  markChatRoomRead,
  sendChatMessage,
} from './chat.api';
import { chatKeys } from './chat.keys';

/** 서버에 실시간 연결(웹소켓)이 없어 화면이 열려 있는 동안 주기적으로 다시 받는다(ms). */
export const CHAT_POLL_INTERVAL = { rooms: 10_000, messages: 5_000 } as const;

/** 한 번에 받는 메시지 수(서버 최대값). 더 오래된 메시지 불러오기는 아직 없다. */
const MESSAGE_PAGE_SIZE = 100;

export const chatQueries = {
  rooms: () => queryOptions({ queryKey: chatKeys.rooms(), queryFn: fetchChatRooms }),
  room: (roomId: number) =>
    queryOptions({ queryKey: chatKeys.room(roomId), queryFn: () => fetchChatRoom(roomId) }),
  messages: (roomId: number) =>
    queryOptions({
      queryKey: chatKeys.messages(roomId),
      queryFn: () => fetchChatMessages(roomId, { size: MESSAGE_PAGE_SIZE }),
    }),
  partners: (params: ChatPartnerListParams = {}) =>
    queryOptions({
      queryKey: chatKeys.partners(params),
      queryFn: () => fetchChatPartners(params),
    }),
};

export interface SendChatMessageVariables {
  roomId: number;
  content: string;
}

/** 채팅방을 만든다(이미 있으면 그 방). vars 는 상대 user id. */
export function useCreateChatRoomMutation(): UseMutationResult<ChatRoom, ApiError, number> {
  const queryClient = useQueryClient();
  return useMutation<ChatRoom, ApiError, number>({
    mutationFn: createChatRoom,
    // 신고 카드의 채팅 상태(chatRoomId)도 바뀌므로 신고 목록도 다시 받는다. 재조회를 기다리지 않는다.
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chatKeys.rooms(), exact: true });
      void queryClient.invalidateQueries({ queryKey: reportKeys.all });
    },
  });
}

export function useSendChatMessageMutation(): UseMutationResult<
  ChatMessage,
  ApiError,
  SendChatMessageVariables
> {
  const queryClient = useQueryClient();
  return useMutation<ChatMessage, ApiError, SendChatMessageVariables>({
    mutationFn: ({ roomId, content }) => sendChatMessage(roomId, content),
    // 방 목록의 마지막 메시지도 바뀌므로 함께 다시 받는다. 보낸 메시지가 바로 보이도록 메시지 재조회는 기다린다.
    onSuccess: async (_message, { roomId }) => {
      void queryClient.invalidateQueries({ queryKey: chatKeys.rooms(), exact: true });
      await queryClient.invalidateQueries({ queryKey: chatKeys.messages(roomId) });
    },
  });
}

/** 방의 상대 메시지를 읽음으로 바꾼다. vars 는 roomId. */
export function useMarkChatRoomReadMutation(): UseMutationResult<ChatReadResult, ApiError, number> {
  const queryClient = useQueryClient();
  return useMutation<ChatReadResult, ApiError, number>({
    mutationFn: markChatRoomRead,
    onSuccess: (_result, roomId) => {
      void queryClient.invalidateQueries({ queryKey: chatKeys.rooms(), exact: true });
      void queryClient.invalidateQueries({ queryKey: chatKeys.room(roomId), exact: true });
    },
  });
}
