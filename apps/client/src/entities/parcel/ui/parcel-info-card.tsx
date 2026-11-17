import { formatInvoiceNumber } from '@taekbae/utils';
import { type StyleProp, View, type ViewStyle } from 'react-native';

import { makeStyles, Typography } from '@/shared/ui';

export interface ParcelInfoCardProps {
  /** 카드 맨 위 브랜드 색 문구 (예: "신고 대상 택배") */
  label: string;
  alias: string;
  deliveryCompany: string;
  invoiceNumber: string;
  style?: StyleProp<ViewStyle>;
}

/** 택배 별칭·택배사·운송장 번호를 보여주는 연한 브랜드 카드 (시안 C9). */
export function ParcelInfoCard({
  label,
  alias,
  deliveryCompany,
  invoiceNumber,
  style,
}: ParcelInfoCardProps) {
  const styles = useStyles();
  const formattedInvoiceNumber = formatInvoiceNumber(invoiceNumber);

  return (
    <View
      accessible
      accessibilityLabel={`${label}, ${alias}, ${deliveryCompany} 운송장 번호 ${formattedInvoiceNumber}`}
      style={[styles.card, style]}
    >
      <Typography variant="bodyMStrong" color="textBrand">
        {label}
      </Typography>
      <Typography variant="bodyMStrong" numberOfLines={1}>
        {alias}
      </Typography>
      <Typography variant="bodyMStrong" color="textSecondary" numberOfLines={1}>
        {`${deliveryCompany} · ${formattedInvoiceNumber}`}
      </Typography>
    </View>
  );
}

const useStyles = makeStyles(({ colors, radius, shadow, spacing }) => ({
  card: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.bgBrandSoft,
    // 배경(bgApp)과 색 차이가 작아 그림자로 카드를 띄운다.
    ...shadow.brandRaised,
  },
}));
