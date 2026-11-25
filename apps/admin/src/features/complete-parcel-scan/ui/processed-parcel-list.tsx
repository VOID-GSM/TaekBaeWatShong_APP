import { formatInvoiceNumber } from '@taekbae/utils';
import { View } from 'react-native';

import { makeStyles, Typography } from '@/shared/ui';

import type { ProcessedParcel } from '../model/arrival-scan';

export interface ProcessedParcelListProps {
  items: readonly ProcessedParcel[];
}

const pad = (value: number) => String(value).padStart(2, '0');

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * 이번 화면에서 도착 처리한 택배 (최신순, 최대 RECENT_LIMIT 건).
 * 건수가 작아 ScrollView 안에서 바로 그린다 — 가상화 리스트를 겹치지 않으려는 것.
 */
export function ProcessedParcelList({ items }: ProcessedParcelListProps) {
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <Typography variant="headingH1" accessibilityRole="header">
        {`이번에 처리한 택배 ${items.length}건`}
      </Typography>
      {items.length === 0 ? (
        <Typography color="textSecondary" style={styles.empty}>
          아직 도착 처리한 택배가 없어요.
        </Typography>
      ) : (
        <View style={styles.list}>
          {items.map(({ id, parcel, processedAt }, index) => {
            const zone = parcel.zone ? `${parcel.zone} 구역` : '구역 미지정';
            const time = formatTime(processedAt);
            const invoice = formatInvoiceNumber(parcel.invoiceNumber);
            return (
              <View
                key={id}
                style={[styles.row, index > 0 && styles.divider]}
                accessible
                accessibilityLabel={`${parcel.alias}, 운송장 ${invoice}, ${zone}, ${time} 처리`}
              >
                <View style={styles.main}>
                  <Typography variant="bodyMStrong" numberOfLines={1}>
                    {parcel.alias}
                  </Typography>
                  <Typography variant="caption" color="textSecondary" numberOfLines={1}>
                    {invoice}
                  </Typography>
                </View>
                <Typography color="textBrand">{zone}</Typography>
                <Typography variant="caption" color="textSecondary" style={styles.time}>
                  {time}
                </Typography>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const useStyles = makeStyles(({ colors, radius, shadow, spacing }) => ({
  container: {
    alignSelf: 'stretch',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.bgSurface,
    ...shadow.card,
  },
  empty: { paddingVertical: spacing.sm },
  list: { alignSelf: 'stretch' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  divider: { borderTopWidth: 1, borderTopColor: colors.borderDefault },
  main: { flex: 1, gap: spacing.xs },
  time: { minWidth: spacing['4xl'], textAlign: 'right' },
}));
