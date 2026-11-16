import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OverdueRankRow } from '@/entities/parcel';
import { Icon, makeStyles, TopBar, Typography } from '@/shared/ui';
import { ZoneMapCard } from '@/widgets/zone-map';

import { MOCK_LEFT_SHELF, MOCK_OVERDUE_TOP3, MOCK_RIGHT_SHELF } from '../model/mock';

/** 구역 약도 + 방치 택배 TOP3 */
export function ZonePage() {
  const styles = useStyles();

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <TopBar title="구역 · 방치자" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ZoneMapCard leftShelf={MOCK_LEFT_SHELF} rightShelf={MOCK_RIGHT_SHELF} />

        <View style={styles.sectionHeader}>
          <Icon name="alert" />
          <Typography variant="bodyMStrong" accessibilityRole="header" style={styles.flex}>
            가져가지 않은 택배 TOP 3
          </Typography>
        </View>
        <Typography variant="bodyMStrong" color="textSecondary">
          방치 1일 초과 시 방치자로 집계되어 순위에 올라가요
        </Typography>

        {MOCK_OVERDUE_TOP3.map((item) => (
          <OverdueRankRow key={item.rank} item={item} />
        ))}
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
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
}));
