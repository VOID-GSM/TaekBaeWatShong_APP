import { SafeAreaView } from 'react-native-safe-area-context';

import { makeStyles, Typography } from '@/shared/ui';

/** 시안이 아직 없는 탭(신고·스캔·QR)의 임시 화면. */
export function ComingSoonPage({ title }: { title: string }) {
  const styles = useStyles();

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Typography variant="bodyMStrong" accessibilityRole="header">
        {title}
      </Typography>
      <Typography color="textSecondary">준비 중인 화면이에요.</Typography>
    </SafeAreaView>
  );
}

const useStyles = makeStyles(({ colors, spacing }) => ({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.bgApp,
  },
}));
