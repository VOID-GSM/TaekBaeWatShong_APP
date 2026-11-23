import { Image, View } from 'react-native';

import { makeStyles, Typography } from '@/shared/ui';

import { formatDriverName } from '../lib/format';

export interface DriverQrCardProps {
  driverName: string;
  deliveryCompany: string;
  /** 서버가 내려준 PNG data URL */
  qrImageUrl: string;
}

/** 발급된 기사 QR 카드 (Figma `QR card`). */
export function DriverQrCard({ driverName, deliveryCompany, qrImageUrl }: DriverQrCardProps) {
  const styles = useStyles();
  const name = formatDriverName(driverName);

  return (
    <View style={styles.card}>
      <Image
        source={{ uri: qrImageUrl }}
        style={styles.qr}
        resizeMode="contain"
        accessibilityRole="image"
        accessibilityLabel={`${name} 식별 QR 코드`}
      />
      <View style={styles.texts}>
        <Typography variant="headingH1" align="center">
          {name}
        </Typography>
        <Typography variant="caption" color="textSecondary" align="center">
          {`${deliveryCompany} · 이 QR로 기사님을 식별해요`}
        </Typography>
      </View>
    </View>
  );
}

const useStyles = makeStyles(({ colors, radius, shadow, size, spacing }) => ({
  card: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing['2xl'],
    borderRadius: radius['2xl'],
    backgroundColor: colors.bgSurface,
    ...shadow.card,
  },
  qr: { width: size.qrCode, height: size.qrCode, backgroundColor: colors.bgSurface },
  texts: { alignSelf: 'stretch', gap: 2 },
}));
