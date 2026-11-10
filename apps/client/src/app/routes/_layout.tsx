import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { useAuthStore } from '@/features/auth';
import { fontAssets } from '@/shared/ui';

import { AppProviders } from '../providers';

/** 서버 없이 화면만 볼 때 로그인을 건너뛴다. 개발 빌드에서 .env 로 켤 때만 동작한다. */
const DEV_SKIP_AUTH = __DEV__ && process.env.EXPO_PUBLIC_DEV_SKIP_AUTH === 'true';

// 폰트와 저장된 세션을 읽을 때까지 스플래시를 유지한다.
void SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigator() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const status = useAuthStore((state) => state.status);

  // 폰트 로드가 실패해도 앱은 시스템 폰트로 띄운다.
  const isReady =
    (fontsLoaded || fontError !== null) && (status !== 'initializing' || DEV_SKIP_AUTH);
  const isAuthenticated = status === 'authenticated' || DEV_SKIP_AUTH;

  useEffect(() => {
    if (isReady) {
      void SplashScreen.hideAsync().catch(() => {});
    }
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  // 로그인 중(status === 'loading')에는 로그인 화면을 그대로 둔다.
  // OAuth 콜백 딥링크는 +native-intent 가 '/' 로 돌리고, 미인증이면 가드가 다시 /login 으로 보낸다.
  return (
    <Stack>
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      {/* 다크 시안이 없어 화면이 항상 밝은 배경이다. 다크 토큰이 생기면 auto 로 되돌린다. */}
      <StatusBar style="dark" />
      <RootNavigator />
    </AppProviders>
  );
}
