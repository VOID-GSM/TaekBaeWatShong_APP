import { formatElapsed, formatInvoiceNumber, formatMonthDayTime } from '@taekbae/utils';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { type ClaimedParcel, ClaimedParcelRow, useRecentlyClaimedParcels } from '@/entities/parcel';
import {
  ClaimResultToast,
  ScannedParcelCard,
  ScannerHero,
  useClaimParcelByScan,
} from '@/features/claim-parcel';
import { useNow } from '@/shared/hooks';
import {
  BarcodeScannerInput,
  type BarcodeScannerInputHandle,
  makeStyles,
  TopBar,
  Typography,
  useTheme,
} from '@/shared/ui';

/**
 * 택배 회수. 바코드 스캐너(키보드 방식)로 운송장을 찍으면
 * C7(스캔 대기 + 방금 회수한 택배) → C8(스캔한 택배 확인 + 회수 완료 처리)로 바뀐다.
 */
export function ParcelPickupPage() {
  const styles = useStyles();
  const { colors } = useTheme();
  const scannerRef = useRef<BarcodeScannerInputHandle>(null);
  const [isScannerReady, setScannerReady] = useState(false);
  // 탭 화면은 다른 탭으로 가도 언마운트되지 않는다 — 보일 때만 스캐너 입력을 받는다.
  const [isScreenFocused, setScreenFocused] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setScreenFocused(true);
      return () => setScreenFocused(false);
    }, []),
  );
  const { scan, scanned, isLookingUp, confirm, isClaiming, result } = useClaimParcelByScan();
  const recent = useRecentlyClaimedParcels();
  const showRecent = !scanned;
  const now = useNow(1000, showRecent && recent.parcels.length > 0);

  const header = (
    <View style={styles.header}>
      <ScannerHero
        isReady={isScannerReady}
        busyLabel={isClaiming ? '회수 처리 중…' : isLookingUp ? '택배 확인 중…' : null}
        onReconnect={() => scannerRef.current?.focus()}
      />
      {scanned ? (
        <ScannedParcelCard
          parcel={scanned}
          isClaiming={isClaiming}
          onConfirm={() => void confirm()}
        />
      ) : (
        <View style={styles.sectionHeader}>
          <Typography variant="bodyL" accessibilityRole="header" style={styles.flex}>
            방금 회수한 택배
          </Typography>
          {recent.parcels.length > 0 && (
            <Typography variant="caption" color="textBrand">
              {recent.parcels.length}건
            </Typography>
          )}
        </View>
      )}
    </View>
  );

  const empty = recent.isPending ? (
    <ActivityIndicator color={colors.iconBrand} style={styles.status} />
  ) : recent.error ? (
    <View style={styles.status}>
      <Typography color="textSecondary" align="center">
        회수한 택배를 불러오지 못했어요.
      </Typography>
      <Pressable accessibilityRole="button" onPress={recent.refetch} hitSlop={12}>
        <Typography variant="bodyMStrong" color="textBrand" align="center">
          다시 시도
        </Typography>
      </Pressable>
    </View>
  ) : (
    <Typography color="textTertiary" align="center" style={styles.status}>
      오늘 회수한 택배가 아직 없어요
    </Typography>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <TopBar title="택배 회수" />
      <BarcodeScannerInput
        ref={scannerRef}
        active={isScreenFocused}
        onScan={(value) => void scan(value)}
        onReadyChange={setScannerReady}
      />

      <View style={styles.flex}>
        <FlatList
          data={showRecent ? recent.parcels : EMPTY}
          keyExtractor={keyExtractor}
          renderItem={({ item }) => (
            <ClaimedParcelRow
              invoiceNumber={formatInvoiceNumber(item.parcel.invoiceNumber)}
              meta={formatMeta(item)}
              elapsed={formatElapsed(now.getTime() - item.claimedAt.getTime())}
              zone={item.parcel.zone}
            />
          )}
          ListHeaderComponent={header}
          ListEmptyComponent={showRecent ? empty : undefined}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          // 목록을 눌러도 숨은 스캐너 입력칸의 포커스를 뺏지 않는다.
          keyboardShouldPersistTaps="always"
        />
        <ClaimResultToast result={result} />
      </View>
    </SafeAreaView>
  );
}

const EMPTY: ClaimedParcel[] = [];

const keyExtractor = (item: ClaimedParcel) => String(item.parcel.id);

function formatMeta({ parcel, arrivedAt }: ClaimedParcel): string {
  const parts = [parcel.ownerName, arrivedAt && `도착 ${formatMonthDayTime(arrivedAt)}`];
  return parts.filter(Boolean).join(' · ');
}

const useStyles = makeStyles(({ colors, spacing }) => ({
  screen: { flex: 1, backgroundColor: colors.bgApp },
  content: {
    gap: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  header: { gap: spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center' },
  status: { paddingVertical: spacing['2xl'], gap: spacing.sm },
  flex: { flex: 1 },
}));
