import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { alertXml } from '@/shared/assets/alert';
import { makeStyles, Typography, useTheme } from '@/shared/ui';

/** 채팅방 위 분실 신고 요약 (시안 A9 `Report summary`). */
export function ReportBanner({ label }: { label: string }) {
  const styles = useStyles();
  const { colors, size } = useTheme();

  return (
    <View style={styles.container}>
      <SvgXml xml={alertXml} width={size.iconXs} height={size.iconXs} color={colors.textDanger} />
      <Typography variant="caption" color="textDanger" style={styles.text}>
        {label}
      </Typography>
    </View>
  );
}

const useStyles = makeStyles(({ colors, radius, spacing }) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.bgDangerSoft,
  },
  text: { flex: 1 },
}));
