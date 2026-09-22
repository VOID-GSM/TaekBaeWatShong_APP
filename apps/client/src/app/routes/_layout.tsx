import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AppProviders } from '../providers';

export default function RootLayout() {
  return (
    <AppProviders>
      <StatusBar style="auto" />
      <Stack />
    </AppProviders>
  );
}
