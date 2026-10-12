import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type PropsWithChildren, useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initializeAuthSession } from '@/features/auth';

export function AppProviders({ children }: PropsWithChildren) {
  // Fast Refresh 때 캐시가 날아가지 않도록 state 로 한 번만 만든다.
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    void initializeAuthSession().catch(() => {
      // initializeAuthSession records startup failures in the auth store.
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
