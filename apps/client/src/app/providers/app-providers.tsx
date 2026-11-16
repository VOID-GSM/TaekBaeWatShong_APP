import { configureApi, resolveApiBaseUrl } from '@taekbae/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type PropsWithChildren, useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initializeAuthSession, logout, readAppAccessToken } from '@/features/auth';

let isApiConfigured = false;

/**
 * 자식의 쿼리가 첫 요청을 보내기 전에 axios 인스턴스가 있어야 하므로 렌더 중에 한 번만 설정한다.
 * `EXPO_PUBLIC_API_URL` 이 없으면 설정하지 않는다 — 요청 시 `ApiError` 로 실패하고, 로그인 흐름도 같은 이유로 에러를 보여준다.
 */
function setupApi() {
  if (isApiConfigured) return;

  let baseURL: string;
  try {
    baseURL = resolveApiBaseUrl(process.env.EXPO_PUBLIC_API_URL);
  } catch (error) {
    console.warn(error);
    return;
  }

  configureApi({
    baseURL,
    getAccessToken: readAppAccessToken,
    onUnauthorized: () => void logout().catch(() => {}),
  });
  isApiConfigured = true;
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, retry: 1 },
      mutations: { retry: 0 },
    },
  });
}

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => {
    setupApi();
    return createQueryClient();
  });

  useEffect(() => {
    void initializeAuthSession().catch(() => {});
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
