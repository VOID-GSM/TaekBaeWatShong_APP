import { formatInvoiceNumber } from '@taekbae/utils';
import { useEffect } from 'react';
import { AccessibilityInfo, ActivityIndicator, Platform, View } from 'react-native';

import { Badge, type ColorToken, makeStyles, Typography, useTheme } from '@/shared/ui';

import type { ArrivalScanResult } from '../model/arrival-scan';

export interface ArrivalResultCardProps {
  result: ArrivalScanResult | null;
  isPending: boolean;
}

type Tone = 'success' | 'warning' | 'danger';

interface ResultView {
  tone: Tone;
  badge: string;
  headline: string;
  invoiceNumber: string;
  /** 성공일 때만: 구역 문구 */
  zone?: string;
}

const HEADLINE_COLOR: Record<Tone, ColorToken> = {
  success: 'textPrimary',
  warning: 'textWarning',
  danger: 'textDanger',
};

function toView(result: ArrivalScanResult): ResultView {
  switch (result.type) {
    case 'success':
      return {
        tone: 'success',
        badge: '도착 처리 완료',
        headline: result.parcel.alias,
        invoiceNumber: result.parcel.invoiceNumber,
        zone: result.parcel.zone ? `${result.parcel.zone} 구역` : '구역 미지정',
      };
    case 'notFound':
      return {
        tone: 'danger',
        badge: '처리 실패',
        headline: '등록되지 않은 택배',
        invoiceNumber: result.invoiceNumber,
      };
    case 'alreadyDone':
      return {
        tone: 'warning',
        badge: '확인 필요',
        headline: '이미 처리된 택배',
        invoiceNumber: result.invoiceNumber,
      };
    case 'error':
      return {
        tone: 'danger',
        badge: '처리 실패',
        headline: result.message,
        invoiceNumber: result.invoiceNumber,
      };
  }
}

function announcement(view: ResultView): string {
  return [view.badge, view.headline, view.zone].filter(Boolean).join(', ');
}

/**
 * 마지막 스캔 결과. 노트북·태블릿을 멀리서 봐도 알아보게 글자를 크게 쓰고, 결과마다 카드 색을 바꾼다.
 * 결과는 다음 스캔까지 남는다.
 */
export function ArrivalResultCard({ result, isPending }: ArrivalResultCardProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const view = result ? toView(result) : null;

  // Android 는 accessibilityLiveRegion 으로 읽지만 iOS 는 지원하지 않아 직접 알린다.
  // 결과는 매번 새 객체라 같은 문구가 연달아 와도 다시 읽는다.
  useEffect(() => {
    if (Platform.OS === 'ios' && result) {
      AccessibilityInfo.announceForAccessibility(announcement(toView(result)));
    }
  }, [result]);

  const pendingIndicator = isPending ? (
    <View style={styles.pending}>
      <ActivityIndicator color={colors.textBrand} />
      <Typography color="textSecondary">확인하고 있어요…</Typography>
    </View>
  ) : null;

  if (!view) {
    return (
      <View style={[styles.card, styles.idle]} accessibilityLiveRegion="polite">
        {pendingIndicator ?? (
          <>
            <Typography variant="displayL" align="center">
              바코드를 스캔해 주세요
            </Typography>
            <Typography variant="bodyL" color="textSecondary" align="center">
              스캔하면 바로 도착 처리돼요.
            </Typography>
          </>
        )}
      </View>
    );
  }

  return (
    <View
      testID="arrival-result"
      style={[styles.card, styles[view.tone]]}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.header}>
        <Badge tone={view.tone} label={view.badge} style={styles.badge} />
        {pendingIndicator}
      </View>
      <Typography variant="displayXL" color={HEADLINE_COLOR[view.tone]} numberOfLines={2}>
        {view.headline}
      </Typography>
      <Typography variant="displayM" color="textSecondary" selectable>
        {formatInvoiceNumber(view.invoiceNumber)}
      </Typography>
      {view.zone !== undefined && (
        <Typography variant="displayL" color="textSuccess">
          {view.zone}
        </Typography>
      )}
    </View>
  );
}

const useStyles = makeStyles(({ colors, radius, shadow, size, spacing }) => ({
  card: {
    alignSelf: 'stretch',
    minHeight: size.arrivalResult,
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing['2xl'],
    borderRadius: radius.xl,
    ...shadow.card,
  },
  idle: { alignItems: 'center', backgroundColor: colors.bgSurface },
  success: { backgroundColor: colors.bgSuccessSoft },
  warning: { backgroundColor: colors.bgWarningSoft },
  danger: { backgroundColor: colors.bgDangerSoft },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  // 연한 결과 배경 위에서도 배지가 보이게 흰 바탕을 깐다.
  badge: { backgroundColor: colors.bgSurface },
  pending: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
}));
