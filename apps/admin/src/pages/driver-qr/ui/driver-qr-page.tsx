import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CreateDriverQrPanel } from '@/features/create-driver-qr';
import { ScanDriverQrPanel } from '@/features/scan-driver-qr';
import { makeStyles, SegmentedControl, TopBar } from '@/shared/ui';

type QrMode = 'create' | 'scan';

const MODES = [
  { value: 'create', label: 'QR 생성' },
  { value: 'scan', label: 'QR 인식' },
] as const;

/** 관리자 QR 탭 (시안 A11 · A12). 기사 QR 발급과 인식을 세그먼트로 전환한다. */
export function DriverQrPage() {
  const styles = useStyles();
  const [mode, setMode] = useState<QrMode>('create');
  // 탭 화면은 다른 탭으로 가도 언마운트되지 않는다 — 보이지 않을 때는 카메라를 끈다.
  const [isFocused, setIsFocused] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, []),
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <TopBar variant="title" title="QR" />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <SegmentedControl options={MODES} value={mode} onChange={setMode} />
        {mode === 'create' ? <CreateDriverQrPanel /> : <ScanDriverQrPanel active={isFocused} />}
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles(({ colors, spacing }) => ({
  screen: { flex: 1, backgroundColor: colors.bgApp },
  content: {
    flexGrow: 1,
    gap: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
}));
