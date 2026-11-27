import { z } from 'zod';

import { userRoleSchema } from './user';

/**
 * 서버 `LocalDateTime` 문자열. 시간대 표기가 없다(`2026-07-06T15:30:00.123456`).
 * 기기 시각으로 바꿀 때는 `@taekbae/utils` 의 `localDateTimeToDate` 를 쓴다(report 와 같은 규칙).
 */
const serverDateTimeSchema = z.iso.datetime({ local: true });

/** DRIVER: 관리자(택배기사) ↔ 학생·선생님, CLIENT: 학생 ↔ 선생님 */
export const chatRoomTypeSchema = z.enum(['DRIVER', 'CLIENT']);

export const chatPartnerSchema = z.object({
  id: z.number(),
  name: z.string(),
  role: userRoleSchema,
  studentNumber: z.string().nullish(),
});

/** `GET /chat/rooms/{roomId}`, `POST /chat/rooms` 응답. */
export const chatRoomSchema = z.object({
  id: z.number(),
  type: chatRoomTypeSchema,
  partner: chatPartnerSchema,
  lastMessage: z.string().nullish(),
  lastMessageAt: serverDateTimeSchema.nullish(),
  unreadCount: z.number(),
  createdAt: serverDateTimeSchema,
});

/** `GET /chat/rooms` 응답. */
export const chatRoomListSchema = z.object({
  totalUnreadCount: z.number(),
  rooms: z.array(chatRoomSchema),
});

export const chatMessageSchema = z.object({
  id: z.number(),
  roomId: z.number(),
  senderId: z.number(),
  senderName: z.string(),
  content: z.string(),
  isMine: z.boolean(),
  isRead: z.boolean(),
  createdAt: serverDateTimeSchema,
});

/** `GET /chat/rooms/{roomId}/messages` 응답. 최신 메시지가 앞에 온다. */
export const chatMessageListSchema = z.object({
  messages: z.array(chatMessageSchema),
  /** 더 오래된 메시지를 받을 때 `cursor` 로 넘긴다. 없으면 마지막 페이지. */
  nextCursor: z.number().nullish(),
});

/** `GET /chat/partners` 응답. */
export const chatPartnerListSchema = z.object({
  partners: z.array(chatPartnerSchema),
  hasNext: z.boolean(),
});

/** `PATCH /chat/rooms/{roomId}/read` 응답. */
export const chatReadResultSchema = z.object({
  roomId: z.number(),
  readCount: z.number(),
  unreadCount: z.number(),
});

/** `POST /chat/rooms/{roomId}/messages` 요청. 서버 검증과 같은 규칙. */
export const sendChatMessageRequestSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, '메시지 내용을 입력해주세요.')
    .max(1000, '메시지는 1000자까지 입력할 수 있습니다.'),
});

export interface ChatMessageListParams {
  cursor?: number;
  size?: number;
}

export interface ChatPartnerListParams {
  keyword?: string;
  page?: number;
  size?: number;
}

export type ChatRoomType = z.infer<typeof chatRoomTypeSchema>;
export type ChatPartner = z.infer<typeof chatPartnerSchema>;
export type ChatRoom = z.infer<typeof chatRoomSchema>;
export type ChatRoomList = z.infer<typeof chatRoomListSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatMessageList = z.infer<typeof chatMessageListSchema>;
export type ChatPartnerList = z.infer<typeof chatPartnerListSchema>;
export type ChatReadResult = z.infer<typeof chatReadResultSchema>;
export type SendChatMessageRequest = z.infer<typeof sendChatMessageRequestSchema>;
