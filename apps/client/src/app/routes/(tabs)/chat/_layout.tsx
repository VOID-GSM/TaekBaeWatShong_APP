import { Stack } from 'expo-router';

// 채팅 목록 → 채팅방을 탭 안에서 스택으로 쌓아, 채팅방에서도 하단 탭 바가 보이게 한다.
export default function ChatLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
