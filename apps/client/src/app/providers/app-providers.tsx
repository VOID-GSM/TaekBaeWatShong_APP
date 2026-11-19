import { configureApi, resolveApiBaseUrl } from '@taekbae/api';
import { focusManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type PropsWithChildren, useEffect, useState } from 'react';
import { AppState, type AppStateStatus, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  initializeAuthSession,
  logout,
  readAppAccessToken,
  setLogoutCleanup,
  useAuthStore,
} from '@/features/auth';
import {
  configureForegroundNotifications,
  registerPushToken,
  unregisterPushToken,
} from '@/features/push-notification';

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
  // 로그아웃(401 로 인한 자동 로그아웃·앱 시작 시 만료 포함)하면 세션을 지우기 전에 이 기기의 푸시 토큰을 지운다.
  // 지우지 않으면 로그아웃한 기기로 이전 계정의 택배 알림이 계속 간다.
  setLogoutCleanup(unregisterPushToken);
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

/**
 * RN 에는 브라우저의 visibilitychange 가 없어 react-query 가 앱 복귀를 모른다.
 * AppState 를 focusManager 에 연결해, 포그라운드로 돌아오면 stale 쿼리를 다시 조회하게 한다(TanStack Query RN 가이드).
 * 웹은 react-query 기본 리스너(visibilitychange)가 이미 처리한다.
 */
function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') focusManager.setFocused(status === 'active');
}

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => {
    setupApi();
    configureForegroundNotifications();
    return createQueryClient();
  });

  // 로그인하거나 저장된 세션을 복원하면 이 기기의 푸시 토큰을 등록한다. 실패하면 다음 앱 실행 때 다시 시도한다.
  useEffect(
    () =>
      useAuthStore.subscribe((state, prev) => {
        if (prev.user === null && state.user !== null) {
          registerPushToken().catch((error: unknown) => console.warn('푸시 토큰 등록 실패', error));
        }
      }),
    [],
  );

  useEffect(() => {
    void initializeAuthSession().catch(() => {});
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, []);

  // 로그아웃(만료 포함)하면 이전 사용자의 응답이 다음 사용자에게 보이지 않도록 캐시를 비운다.
  useEffect(
    () =>
      useAuthStore.subscribe((state, prev) => {
        if (prev.user !== null && state.user === null) queryClient.clear();
      }),
    [queryClient],
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
