import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ArrivalScanPanel } from '@/features/complete-parcel-scan';
import { makeStyles, TopBar } from '@/shared/ui';

/** 관리자 택배 스캔 탭 — 바코드 스캐너로 택배 도착 처리 (Figma 시안 없음, 디자인 미대조). */
export function ParcelScanPage() {
  const styles = useStyles();
  // 탭 화면은 다른 탭으로 가도 언마운트되지 않는다 — 보이지 않을 때는 입력칸이 포커스를 놓게 한다.
  const [isFocused, setIsFocused] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, []),
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <TopBar variant="title" title="택배 스캔" />
      {/* 끌어도 키보드를 내리지 않는다 — 입력칸이 포커스를 되찾느라 깜빡이지 않게. */}
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ArrivalScanPanel active={isFocused} />
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
