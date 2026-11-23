import { formatMonthDayTime, localDateTimeToDate } from '@taekbae/utils';
import { ActivityIndicator, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { formatDriverName } from '@/entities/driver';
import { infoXml } from '@/shared/assets/info';
import { Badge, makeStyles, Typography, useTheme } from '@/shared/ui';

import { useScanDriverQr } from '../model/use-scan-driver-qr';
import { QrScanViewfinder } from './qr-scan-viewfinder';

export interface ScanDriverQrPanelProps {
  /** 카메라를 켤 때 (화면이 보이고 이 탭이 선택됐을 때) */
  active: boolean;
}

function formatScannedAt(scannedAt: string): string {
  const date = localDateTimeToDate(scannedAt);
  return date ? formatMonthDayTime(date) : scannedAt;
}

/** QR 인식 탭 (시안 A12). 탭을 열면 카메라가 바로 뜨고, 기사 QR 을 비추면 방문 기록을 남긴다. */
export function ScanDriverQrPanel({ active }: ScanDriverQrPanelProps) {
  const styles = useStyles();
  const { colors, size } = useTheme();
  const { handleScan, result, error, isPending } = useScanDriverQr();

  const renderResult = () => {
    if (isPending) {
      return (
        <View style={[styles.result, styles.resultRow]} accessibilityLiveRegion="polite">
          <ActivityIndicator color={colors.textBrand} />
          <Typography color="textSecondary">기사님을 확인하고 있어요…</Typography>
        </View>
      );
    }
    if (error !== null) {
      return (
        <View style={styles.result} accessibilityRole="alert">
          <Badge tone="danger" label="인식 실패" />
          <Typography>{error.message}</Typography>
        </View>
      );
    }
    if (result) {
      return (
        <View style={styles.result} accessibilityLiveRegion="polite">
          <Badge tone="success" label="방문 기록 완료" />
          <Typography variant="headingH1">{formatDriverName(result.driverName)}</Typography>
          <Typography variant="caption" color="textSecondary">
            {`${result.deliveryCompany} · ${formatScannedAt(result.scannedAt)} 인식`}
          </Typography>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <QrScanViewfinder active={active} onScan={handleScan} />
      {renderResult()}
      <View style={styles.info}>
        <SvgXml xml={infoXml} width={size.iconS} height={size.iconS} color={colors.textBrand} />
        <Typography variant="caption" color="textBrandStrong" style={styles.infoText}>
          기사님 QR을 인식하면 기사님이 방문한 시각이 기록돼요.
        </Typography>
      </View>
    </View>
  );
}

const useStyles = makeStyles(({ colors, radius, shadow, spacing }) => ({
  container: { alignSelf: 'stretch', gap: spacing.lg },
  result: {
    alignSelf: 'stretch',
    alignItems: 'flex-start',
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.bgSurface,
    ...shadow.card,
  },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  info: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.bgBrandSoft,
  },
  infoText: { flex: 1 },
}));
