import type { Parcel } from '@taekbae/types';
import { formatInvoiceNumber } from '@taekbae/utils';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Button, Card, Icon, makeStyles, Typography } from '@/shared/ui';

export interface ScannedParcelCardProps {
  parcel: Parcel;
  isClaiming: boolean;
  onConfirm: () => void;
}

/** 스캔한 택배 확인 카드 + 회수 완료 버튼 (Figma C8 `Result card`). */
export function ScannedParcelCard({ parcel, isClaiming, onConfirm }: ScannedParcelCardProps) {
  const styles = useStyles();
  const detail = [parcel.zone && `${parcel.zone}구역`, formatInvoiceNumber(parcel.invoiceNumber)]
    .filter(Boolean)
    .join(' · ');

  return (
    <Animated.View entering={FadeIn} style={styles.wrapper}>
      <Card style={styles.card}>
        <View style={styles.check}>
          <Icon name="check" color="statusSuccess" size={26} />
        </View>
        <View style={styles.texts}>
          <Typography variant="bodyMStrong" align="center" numberOfLines={1}>
            {parcel.alias}
          </Typography>
          <Typography variant="bodyMStrong" color="textSecondary" align="center" numberOfLines={1}>
            {detail}
          </Typography>
        </View>
        <Button
          label="회수 완료 처리"
          variant="brand"
          labelVariant="bodyMStrong"
          loading={isClaiming}
          onPress={onConfirm}
          style={styles.button}
        />
      </Card>
      <Typography variant="bodyMStrong" color="textTertiary" align="center">
        회수 완료하면 ‘가져간 택배’로 상태가 바뀌어요
      </Typography>
    </Animated.View>
  );
}

const useStyles = makeStyles(({ colors, radius, size, spacing }) => ({
  wrapper: { gap: spacing.lg },
  card: { alignItems: 'center', gap: spacing.mdPlus, padding: spacing.xl },
  check: {
    width: size.resultCheck,
    height: size.resultCheck,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: colors.bgSuccessSoft,
  },
  texts: { alignSelf: 'stretch', gap: spacing['2xs'] },
  button: { height: size.buttonResult },
}));
