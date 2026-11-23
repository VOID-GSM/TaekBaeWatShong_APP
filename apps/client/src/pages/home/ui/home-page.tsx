import { normalizeInvoiceNumber } from '@taekbae/utils';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  filterParcels,
  PARCEL_FILTERS,
  ParcelCard,
  type ParcelFilter,
  ParcelSummaryCard,
  useMyParcels,
} from '@/entities/parcel';
import { logout, useAuthStore } from '@/features/auth';
import { confirmAsync } from '@/shared/lib';
import {
  Button,
  Card,
  Icon,
  IconButton,
  makeStyles,
  SelectMenu,
  Typography,
  useTheme,
} from '@/shared/ui';

export function HomePage() {
  const styles = useStyles();
  const { colors, size } = useTheme();
  const userName = useAuthStore((state) => state.user?.name);
  const error = useAuthStore((state) => state.error);
  const [filter, setFilter] = useState<ParcelFilter>('latest');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const myParcels = useMyParcels();
  const parcels = myParcels.parcels ? filterParcels(myParcels.parcels, filter) : [];

  const handleLogout = async () => {
    // 이름 옆 작은 링크라 잘못 누르기 쉽고, 로그아웃하면 DataGSM 로그인을 처음부터 다시 해야 해서 한 번 확인한다.
    const confirmed = await confirmAsync({
      title: '로그아웃할까요?',
      confirmLabel: '로그아웃',
      destructive: true,
    });
    if (!confirmed) return;

    setIsLoggingOut(true);
    // 성공하면 가드가 로그인 화면으로 보낸다. 실패 문구는 스토어의 error 로 표시한다.
    await logout().catch(() => {});
    setIsLoggingOut(false);
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
              onPress={() => void handleLogout()}
              hitSlop={{ left: 8, right: 8 }}
              style={({ pressed }) => [
                styles.logoutLink,
                pressed && styles.pressed,
                isLoggingOut && styles.disabled,
              ]}
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

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={myParcels.isRefetching}
            onRefresh={myParcels.refetch}
            tintColor={colors.textBrand}
          />
        }
      >
        {myParcels.summary && <ParcelSummaryCard summary={myParcels.summary} />}

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

        {myParcels.parcels === undefined ? (
          // 재조회가 실패해도 이미 받은 목록은 유지하고, 첫 조회 전·실패 시에만 이 자리를 쓴다.
          <Card style={styles.status}>
            {myParcels.error === null ? (
              <ActivityIndicator
                color={colors.textBrand}
                accessibilityLabel="내 택배를 불러오는 중"
              />
            ) : (
              <View style={styles.statusMessage}>
                <Typography variant="bodyMStrong" align="center" accessibilityRole="alert">
                  내 택배를 불러오지 못했어요.
                </Typography>
                <Typography color="textSecondary" align="center">
                  {myParcels.error.message}
                </Typography>
                <Button label="다시 시도" variant="outline" size="m" onPress={myParcels.refetch} />
              </View>
            )}
          </Card>
        ) : parcels.length === 0 ? (
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
  status: { alignItems: 'center', justifyContent: 'center', minHeight: 120 },
  statusMessage: { alignItems: 'center', gap: spacing.sm },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logoutLink: { justifyContent: 'center', minHeight: size.touchTarget },
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
