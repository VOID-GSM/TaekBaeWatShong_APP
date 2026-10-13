import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type PropsWithChildren, useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initializeAuthSession } from '@/features/auth';

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient());

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
