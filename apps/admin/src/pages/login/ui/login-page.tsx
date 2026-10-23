import { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { loginAdmin, type OAuthProvider, useAdminAuthStore } from '@/features/auth';
import { Badge, Button, GoogleIcon, LogoMark, makeStyles, Typography } from '@/shared/ui';

export function LoginPage() {
  const styles = useStyles();
  const status = useAdminAuthStore((state) => state.status);
  const error = useAdminAuthStore((state) => state.error);
  const [pendingProvider, setPendingProvider] = useState<OAuthProvider | null>(null);
  const isLoading = status === 'loading';

  const handleLogin = (provider: OAuthProvider) => {
    setPendingProvider(provider);
    // 실패 문구는 스토어의 error 로 화면에 표시한다. 취소는 error 를 남기지 않아 조용히 넘어간다.
    loginAdmin(provider)
      .catch(() => {})
      .finally(() => setPendingProvider(null));
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.halo}>
          <LogoMark />
        </View>
        <View style={styles.titles}>
          <Badge label="ADMIN" />
          <Typography variant="bodyM" color="textSecondary" align="center">
            학생생활안전부 · VOID · 택배 기사님
          </Typography>
        </View>
      </View>

      <View style={styles.actions}>
        <View style={styles.option}>
          <Button
            label="DataGSM으로 계속하기"
            labelVariant="buttonL"
            loading={isLoading && pendingProvider === 'datagsm'}
            disabled={isLoading}
            onPress={() => handleLogin('datagsm')}
          />
          <Typography variant="caption" color="textTertiary" align="center">
            학생생활안전부 선생님 · 관리자
          </Typography>
        </View>
        <View style={styles.option}>
          <Button
            label="Google로 계속하기"
            labelVariant="buttonL"
            leftIcon={<GoogleIcon />}
            loading={isLoading && pendingProvider === 'google'}
            disabled={isLoading}
            onPress={() => handleLogin('google')}
          />
          <Typography variant="caption" color="textTertiary" align="center">
            택배 기사님
          </Typography>
        </View>
        {error !== null && (
          <Typography variant="caption" color="textDanger" align="center" accessibilityRole="alert">
            {error}
          </Typography>
        )}
      </View>
    </SafeAreaView>
  );
}

const useStyles = makeStyles(({ colors, size, spacing }) => ({
  screen: { flex: 1, backgroundColor: colors.bgSurface },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing['2xl'],
  },
  halo: {
    width: size.logoHalo,
    height: size.logoHalo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titles: { alignItems: 'center', gap: spacing.md },
  option: { gap: spacing.sm },
  actions: {
    gap: spacing.mdPlus,
    paddingTop: spacing['3xl'],
    paddingBottom: spacing['4xl'],
    paddingHorizontal: spacing['2xl'],
  },
}));
