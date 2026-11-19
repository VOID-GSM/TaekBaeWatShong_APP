import { View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';

import { Icon, makeStyles, Typography, useTheme } from '@/shared/ui';

import type { ClaimResult } from '../model/use-claim-parcel-by-scan';

export interface ClaimResultToastProps {
  result: ClaimResult | null;
}

/**
 * 스캔 결과 안내. 화면 위쪽에 떠서 잠시 뒤 사라진다(시간은 `useClaimParcelByScan` 이 관리).
 * 시안에 없는 요소라 기존 토큰(성공·위험 연한 배경)으로 구성했다 — 디자이너 확인 필요.
 */
export function ClaimResultToast({ result }: ClaimResultToastProps) {
  const styles = useStyles();
  const { size } = useTheme();
  const isSuccess = result?.type === 'success';

  // 바깥 View 는 항상 두고 안쪽만 바꿔야 사라질 때 exiting 애니메이션이 재생된다.
  return (
    <View style={styles.container} pointerEvents="none">
      {result && (
        <Animated.View
          // 결과가 바뀌면 새 토스트로 다시 등장시킨다.
          key={result.id}
          entering={FadeInUp}
          exiting={FadeOutUp}
          style={[styles.toast, isSuccess ? styles.success : styles.error]}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          <Icon
            name={isSuccess ? 'check' : 'alert'}
            color={isSuccess ? 'statusSuccess' : 'statusDanger'}
            size={size.claimToastIcon}
          />
          <View style={styles.texts}>
            <Typography variant="bodyMStrong" color={isSuccess ? 'textSuccess' : 'textDanger'}>
              {result.message}
            </Typography>
            {isSuccess && result.alias ? (
              <Typography variant="caption" color="textSecondary" numberOfLines={1}>
                {result.alias}
              </Typography>
            ) : null}
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const useStyles = makeStyles(({ borderWidth, colors, radius, shadow, spacing }) => ({
  container: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 10,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: borderWidth.thin,
    ...shadow.card,
  },
  success: { backgroundColor: colors.bgSuccessSoft, borderColor: colors.statusSuccess },
  error: { backgroundColor: colors.bgDangerSoft, borderColor: colors.borderDanger },
  texts: { flex: 1, gap: spacing['2xs'] },
}));
