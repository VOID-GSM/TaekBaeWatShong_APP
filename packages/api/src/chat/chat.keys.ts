import type { ChatPartnerListParams } from '@taekbae/types';

export const chatKeys = {
  all: ['chat'] as const,
  rooms: () => [...chatKeys.all, 'rooms'] as const,
  room: (roomId: number) => [...chatKeys.rooms(), roomId] as const,
  messages: (roomId: number) => [...chatKeys.room(roomId), 'messages'] as const,
  partners: (params: ChatPartnerListParams) => [...chatKeys.all, 'partners', params] as const,
};
