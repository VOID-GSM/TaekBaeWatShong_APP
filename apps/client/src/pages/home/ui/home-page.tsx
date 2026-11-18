import { normalizeInvoiceNumber } from '@taekbae/utils';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  filterParcels,
  PARCEL_FILTERS,
  ParcelCard,
  type ParcelFilter,
  ParcelSummaryCard,
} from '@/entities/parcel';
import { logout, useAuthStore } from '@/features/auth';
import { Icon, IconButton, makeStyles, SelectMenu, Typography, useTheme } from '@/shared/ui';

import { MOCK_PARCELS, MOCK_SUMMARY } from '../model/mock';

export function HomePage() {
  const styles = useStyles();
  const { size } = useTheme();
  const userName = useAuthStore((state) => state.user?.name);
  const error = useAuthStore((state) => state.error);
  const [filter, setFilter] = useState<ParcelFilter>('latest');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const parcels = filterParcels(MOCK_PARCELS, filter);

  const handleLogout = () => {
    setIsLoggingOut(true);
    // 성공하면 가드가 로그인 화면으로 보낸다. 실패 문구는 스토어의 error 로 표시한다.
    logout()
      .catch(() => {})
      .finally(() => setIsLoggingOut(false));
  };

  // 분실 신고 화면은 운송장 번호(숫자만)로 내 택배를 찾는다.
  const openReportLost = (trackingNumber: string) =>
    router.push({
      pathname: '/report/[invoiceNumber]',
      params: { invoiceNumber: normalizeInvoiceNumber(trackingNumber) },
    });

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.flex}>
          <Typography variant="bodyL" color="textSecondary">
            안녕하세요 👋
          </Typography>
          <View style={styles.nameRow}>
            <Typography variant="titlePage" accessibilityRole="header">
              {userName ?? '회원'}님
            </Typography>
            {/* 마이페이지·설정 시안이 없어 이름 옆에 눈에 덜 띄는 링크로 둔다. */}
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: isLoggingOut, busy: isLoggingOut }}
              disabled={isLoggingOut}
              onPress={handleLogout}
              hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
              style={({ pressed }) => [pressed && styles.pressed, isLoggingOut && styles.disabled]}
            >
              <Typography variant="caption" color="textTertiary">
                로그아웃
              </Typography>
            </Pressable>
          </View>
          {error !== null && (
            <Typography variant="caption" color="textDanger" accessibilityRole="alert">
              {error}
            </Typography>
          )}
        </View>
        {/* 약도·방치자 화면으로 가는 탭이 없어 인사말 옆에 눈에 덜 띄는 링크로 둔다. */}
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push('/zone')}
          hitSlop={{ left: 8, right: 8 }}
          style={({ pressed }) => [styles.zoneLink, pressed && styles.pressed]}
        >
          <Typography variant="caption" color="textTertiary">
            택배 약도 확인하기
          </Typography>
          <Icon name="chevronRight" size={size.iconS} />
        </Pressable>
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

const useStyles = makeStyles(({ colors, opacity, size, spacing }) => ({
  screen: { flex: 1, backgroundColor: colors.bgApp },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  zoneLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['2xs'],
    minHeight: size.touchTarget,
  },
  pressed: { opacity: opacity.pressed },
  disabled: { opacity: opacity.disabled },
  flex: { flex: 1 },
}));
