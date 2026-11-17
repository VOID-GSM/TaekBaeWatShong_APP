import { normalizeInvoiceNumber } from '@taekbae/utils';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  filterParcels,
  PARCEL_FILTERS,
  ParcelCard,
  type ParcelFilter,
  ParcelSummaryCard,
} from '@/entities/parcel';
import { useAuthStore } from '@/features/auth';
import { IconButton, makeStyles, SelectMenu, Typography } from '@/shared/ui';

import { MOCK_PARCELS, MOCK_SUMMARY } from '../model/mock';

export function HomePage() {
  const styles = useStyles();
  const userName = useAuthStore((state) => state.user?.name);
  const [filter, setFilter] = useState<ParcelFilter>('latest');
  const router = useRouter();
  const parcels = filterParcels(MOCK_PARCELS, filter);

  // 분실 신고 화면은 운송장 번호(숫자만)로 내 택배를 찾는다.
  const openReportLost = (trackingNumber: string) =>
    router.push({
      pathname: '/report/[invoiceNumber]',
      params: { invoiceNumber: normalizeInvoiceNumber(trackingNumber) },
    });

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Typography variant="bodyL" color="textSecondary">
            안녕하세요 👋
          </Typography>
          <Typography variant="titlePage" accessibilityRole="header">
            {userName ?? '회원'}님
          </Typography>
        </View>
        <IconButton icon="bell" accessibilityLabel="알림" />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ParcelSummaryCard summary={MOCK_SUMMARY} />

        <View style={styles.listHeader}>
          <Typography variant="bodyMStrong" style={styles.flex}>
            내 택배
          </Typography>
          <SelectMenu
            value={filter}
            options={PARCEL_FILTERS}
            onChange={setFilter}
            accessibilityLabel="내 택배 필터"
          />
        </View>

        {parcels.length === 0 ? (
          <Typography variant="bodyMStrong" color="textTertiary" align="center">
            {emptyMessage[filter]}
          </Typography>
        ) : (
          parcels.map((parcel) => (
            <ParcelCard
              key={parcel.id}
              parcel={parcel}
              onReportLost={() => openReportLost(parcel.trackingNumber)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const emptyMessage: Record<ParcelFilter, string> = {
  latest: '아직 등록된 택배가 없어요.',
  claimed: '최근 수령한 택배가 없어요.',
  arrived: '보관 중인 택배가 없어요.',
  pending: '도착 예정인 택배가 없어요.',
};

const useStyles = makeStyles(({ colors, spacing }) => ({
  screen: { flex: 1, backgroundColor: colors.bgApp },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  content: {
    gap: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  listHeader: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
}));
