import { useWindowDimensions, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { infoXml } from '@/shared/assets/info';
import { makeStyles, Typography, useTheme } from '@/shared/ui';

import { useCompleteParcelScan } from '../model/use-complete-parcel-scan';
import { ArrivalResultCard } from './arrival-result-card';
import { ProcessedParcelList } from './processed-parcel-list';
import { ScanInput } from './scan-input';
import { ZonePicker } from './zone-picker';

export interface ArrivalScanPanelProps {
  /** 화면이 보이는 동안 true — 입력칸이 포커스를 잡는다. */
  active: boolean;
}

/**
 * 택배 스캔 탭 (Figma 시안 없음 — 디자인 미대조). 바코드 스캐너로 운송장을 읽으면 바로 도착 처리한다.
 * 넓은 화면(노트북·태블릿)에서는 왼쪽에 입력·결과, 오른쪽에 구역·처리 기록을 둔다.
 */
export function ArrivalScanPanel({ active }: ArrivalScanPanelProps) {
  const styles = useStyles();
  const { colors, size } = useTheme();
  const { width } = useWindowDimensions();
  const wide = width >= size.wideLayout;
  const { submit, zone, setZone, isPending, result, processed } = useCompleteParcelScan();

  return (
    <View style={[styles.container, wide && styles.containerWide]}>
      <View style={[styles.column, wide && styles.columnWide]}>
        <ScanInput active={active} onSubmit={submit} />
        <ArrivalResultCard result={result} isPending={isPending} />
        <View style={styles.info}>
          <SvgXml xml={infoXml} width={size.iconS} height={size.iconS} color={colors.textBrand} />
          <Typography variant="caption" color="textBrandStrong" style={styles.infoText}>
            스캐너로 운송장 바코드를 읽으면 바로 도착 처리돼요. 직접 입력할 때는 번호를 넣고 Enter
            를 눌러 주세요.
          </Typography>
        </View>
      </View>
      <View style={[styles.column, wide && styles.columnWide]}>
        <View style={styles.card}>
          <ZonePicker value={zone} onChange={setZone} />
        </View>
        <ProcessedParcelList items={processed} />
      </View>
    </View>
  );
}

const useStyles = makeStyles(({ colors, radius, shadow, spacing }) => ({
  container: { alignSelf: 'stretch', gap: spacing.lg },
  containerWide: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing['2xl'] },
  column: { alignSelf: 'stretch', gap: spacing.lg },
  columnWide: { flex: 1, alignSelf: 'flex-start' },
  card: {
    alignSelf: 'stretch',
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.bgSurface,
    ...shadow.card,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.bgBrandSoft,
  },
  infoText: { flex: 1 },
}));
