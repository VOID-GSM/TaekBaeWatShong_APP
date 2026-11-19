import type { ApiError } from '@taekbae/api';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useOverdueRanking } from '@/entities/parcel';
import { useZoneShelves } from '@/entities/zone';
import { useGoBack } from '@/shared/hooks';
import { Button, Card, makeStyles, ScreenHeader, Typography, useTheme } from '@/shared/ui';
import { OverdueRankingSection } from '@/widgets/overdue-ranking';
import { ZoneMapCard } from '@/widgets/zone-map';

/** 택배 약도·방치자 — 홈 상단 "택배 약도 확인하기"에서 들어온다. */
export function ZonePage() {
  const styles = useStyles();
  const goBack = useGoBack();
  const zone = useZoneShelves();
  const ranking = useOverdueRanking();

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader title="택배 약도 · 방치자" onBack={goBack} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 두 API 는 따로 실패할 수 있어 섹션마다 로딩·에러를 보여준다. 재조회 실패 시엔 기존 데이터를 유지한다. */}
        {zone.shelves ? (
          <ZoneMapCard leftShelf={zone.shelves.leftShelf} rightShelf={zone.shelves.rightShelf} />
        ) : (
          <SectionStatus
            loadingLabel="택배 보관 구역을 불러오는 중"
            errorTitle="택배 보관 구역을 불러오지 못했어요."
            error={zone.error}
            onRetry={zone.refetch}
          />
        )}

        {ranking.ranks ? (
          <OverdueRankingSection ranks={ranking.ranks} />
        ) : (
          <SectionStatus
            loadingLabel="방치 택배 순위를 불러오는 중"
            errorTitle="방치 택배 순위를 불러오지 못했어요."
            error={ranking.error}
            onRetry={ranking.refetch}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

interface SectionStatusProps {
  loadingLabel: string;
  errorTitle: string;
  error: ApiError | null;
  onRetry: () => void;
}

/** 데이터가 아직 없을 때 섹션 자리에 로딩 또는 에러·다시 시도를 보여준다. */
function SectionStatus({ loadingLabel, errorTitle, error, onRetry }: SectionStatusProps) {
  const styles = useStyles();
  const { colors } = useTheme();

  return (
    <Card style={styles.status}>
      {error === null ? (
        <ActivityIndicator color={colors.textBrand} accessibilityLabel={loadingLabel} />
      ) : (
        <View style={styles.statusMessage}>
          <Typography variant="bodyMStrong" align="center" accessibilityRole="alert">
            {errorTitle}
          </Typography>
          <Typography color="textSecondary" align="center">
            {error.message}
          </Typography>
          <Button label="다시 시도" variant="outline" size="m" onPress={onRetry} />
        </View>
      )}
    </Card>
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
  status: { alignItems: 'center', justifyContent: 'center', minHeight: 120 },
  statusMessage: { alignItems: 'center', gap: spacing.sm },
}));
