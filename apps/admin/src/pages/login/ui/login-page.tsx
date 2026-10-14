import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { loginAdminWithGoogle, useAdminAuthStore } from '@/features/auth';
import { Badge, Button, GoogleIcon, LogoMark, makeStyles, Typography } from '@/shared/ui';

export function LoginPage() {
  const styles = useStyles();
  const status = useAdminAuthStore((state) => state.status);

  const handleLogin = () => {
    // 실패·취소 모두 화면에는 표시하지 않는다. 실패 문구는 스토어의 error 에 남는다.
    loginAdminWithGoogle().catch(() => {});
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
        <Button
          label="Google로 계속하기"
          labelVariant="buttonL"
          leftIcon={<GoogleIcon />}
          loading={status === 'loading'}
          onPress={handleLogin}
        />
        <Typography variant="caption" color="textTertiary" align="center">
          관리자 계정으로 로그인해 주세요
        </Typography>
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
  // 시안의 Halo(220) 안 Ring(160)은 둘 다 채움 없는 가운데 정렬 컨테이너라 Halo 하나로 합쳤다.
  halo: {
    width: size.logoHalo,
    height: size.logoHalo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titles: { alignItems: 'center', gap: spacing.md },
  actions: {
    gap: spacing.mdPlus,
    paddingTop: spacing['3xl'],
    paddingBottom: spacing['4xl'],
    paddingHorizontal: spacing['2xl'],
  },
}));
