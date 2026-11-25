import { useRouter } from 'expo-router';

import { ChatListPage } from '@/pages/chat-list';

export default function ChatListRoute() {
  const router = useRouter();

  return (
    <ChatListPage
      onOpenRoom={(roomId) =>
        router.push({ pathname: '/chats/[roomId]', params: { roomId: String(roomId) } })
      }
    />
  );
}
