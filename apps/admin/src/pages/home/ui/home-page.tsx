import { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { logoutAdmin, useAdminAuthStore } from '@/features/auth';
import { confirmAsync } from '@/shared/lib';
import { Button, makeStyles, Typography } from '@/shared/ui';

export function HomePage() {
  const styles = useStyles();
  const user = useAdminAuthStore((state) => state.user);
  const error = useAdminAuthStore((state) => state.error);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    // 로그아웃하면 OAuth 로그인을 처음부터 다시 해야 해서 한 번 확인한다.
    const confirmed = await confirmAsync({
      title: '로그아웃할까요?',
      confirmLabel: '로그아웃',
      destructive: true,
    });
    if (!confirmed) return;

    setIsLoggingOut(true);
    // 성공하면 가드가 로그인 화면으로 보낸다. 실패 문구는 스토어의 error 로 표시한다.
    await logoutAdmin().catch(() => {});
    setIsLoggingOut(false);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.content}>
        <Typography variant="bodyMStrong" color="textPrimary" align="center">
          {user ? `${user.name}님, 환영합니다` : '택배왔숑 관리자'}
        </Typography>
      </View>

      <View style={styles.actions}>
        {error !== null && (
          <Typography variant="caption" color="textDanger" align="center" accessibilityRole="alert">
            {error}
          </Typography>
        )}
        <Button label="로그아웃" loading={isLoggingOut} onPress={() => void handleLogout()} />
      </View>
    </SafeAreaView>
  );
}

const useStyles = makeStyles(({ colors, spacing }) => ({
  screen: { flex: 1, backgroundColor: colors.bgSurface },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  actions: {
    gap: spacing.mdPlus,
    paddingBottom: spacing['4xl'],
    paddingHorizontal: spacing['2xl'],
  },
}));
