import { useLocalSearchParams, useRouter } from 'expo-router';

import { ChatRoomPage } from '@/pages/chat-room';

/** 숫자가 아닌 파라미터(잘못된 딥링크)는 0 으로 보내 "채팅방을 찾을 수 없어요"로 처리한다. */
function toId(value: string | undefined): number | undefined {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : undefined;
}

export default function ChatRoomRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ roomId: string; reportId?: string }>();

  return (
    <ChatRoomPage
      roomId={toId(params.roomId) ?? 0}
      reportId={toId(params.reportId)}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/chats'))}
    />
  );
}
