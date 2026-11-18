import { useRouter } from 'expo-router';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { makeStyles, ScreenHeader } from '@/shared/ui';
import { OverdueRankingSection } from '@/widgets/overdue-ranking';
import { ZoneMapCard } from '@/widgets/zone-map';

import { MOCK_LEFT_SHELF, MOCK_OVERDUE_TOP3, MOCK_RIGHT_SHELF } from '../model/mock';

/** 택배 약도·방치자 — 홈 상단 "택배 약도 확인하기"에서 들어온다. */
export function ZonePage() {
  const styles = useStyles();
  const router = useRouter();

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader title="택배 약도 · 방치자" onBack={goBack} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ZoneMapCard leftShelf={MOCK_LEFT_SHELF} rightShelf={MOCK_RIGHT_SHELF} />
        <OverdueRankingSection ranks={MOCK_OVERDUE_TOP3} />
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles(({ colors, spacing }) => ({
  screen: { flex: 1, backgroundColor: colors.bgApp },
  content: {
    gap: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
}));
