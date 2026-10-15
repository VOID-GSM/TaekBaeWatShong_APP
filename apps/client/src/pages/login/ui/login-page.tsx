import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { loginWithGoogle, useAuthStore } from '@/features/auth';
import { Button, GoogleIcon, LogoMark, makeStyles, Typography } from '@/shared/ui';

export function LoginPage() {
  const styles = useStyles();
  const status = useAuthStore((state) => state.status);
  const error = useAuthStore((state) => state.error);

  const handleLogin = () => {
    // 실패 문구는 스토어의 error 로 화면에 표시한다. 취소는 error 를 남기지 않아 조용히 넘어간다.
    loginWithGoogle().catch(() => {});
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.ring}>
          <LogoMark />
        </View>
        <Typography variant="bodyMStrong" color="textSecondary" align="center">
          택배 방치·분실 예방 서비스
        </Typography>
      </View>

      <View style={styles.actions}>
        <Button
          label="Google로 계속하기"
          labelVariant="bodyMStrong"
          leftIcon={<GoogleIcon />}
          loading={status === 'loading'}
          onPress={handleLogin}
        />
        {error !== null && (
          <Typography variant="caption" color="textDanger" align="center" accessibilityRole="alert">
            {error}
          </Typography>
        )}
        <Typography variant="bodyMStrong" color="textTertiary" align="center">
          학교 구글 계정으로 로그인해 주세요
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing['2xl'],
  },
  ring: {
    width: size.logoRing,
    height: size.logoRing,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    gap: spacing.mdPlus,
    paddingTop: spacing['3xl'],
    paddingBottom: spacing['4xl'],
    paddingHorizontal: spacing['2xl'],
  },
}));
