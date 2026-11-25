import {
  type ChatMessageListParams,
  chatMessageListSchema,
  chatMessageSchema,
  type ChatPartnerListParams,
  chatPartnerListSchema,
  chatReadResultSchema,
  chatRoomListSchema,
  chatRoomSchema,
  sendChatMessageRequestSchema,
} from '@taekbae/types';

import { api, ApiError, parseResponse } from '../client';

export async function fetchChatRooms() {
  const { data } = await api().get('/chat/rooms');
  return parseResponse(chatRoomListSchema, data);
}

export async function fetchChatRoom(roomId: number) {
  const { data } = await api().get(`/chat/rooms/${roomId}`);
  return parseResponse(chatRoomSchema, data);
}

/** 이미 있는 방이면 그 방을, 없으면 새로 만든 방을 돌려준다. */
export async function createChatRoom(partnerId: number) {
  const { data } = await api().post('/chat/rooms', { partnerId });
  return parseResponse(chatRoomSchema, data);
}

export async function fetchChatMessages(roomId: number, params: ChatMessageListParams = {}) {
  const { data } = await api().get(`/chat/rooms/${roomId}/messages`, { params });
  return parseResponse(chatMessageListSchema, data);
}

export async function sendChatMessage(roomId: number, content: string) {
  const body = sendChatMessageRequestSchema.safeParse({ content });
  if (!body.success) {
    throw new ApiError(body.error.issues[0]?.message ?? '메시지를 확인해 주세요.');
  }
  const { data } = await api().post(`/chat/rooms/${roomId}/messages`, body.data);
  return parseResponse(chatMessageSchema, data);
}

export async function markChatRoomRead(roomId: number) {
  const { data } = await api().patch(`/chat/rooms/${roomId}/read`);
  return parseResponse(chatReadResultSchema, data);
}

export async function fetchChatPartners(params: ChatPartnerListParams = {}) {
  const { data } = await api().get('/chat/partners', { params });
  return parseResponse(chatPartnerListSchema, data);
}
