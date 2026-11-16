import { View } from 'react-native';

import { Button, Card, type ColorToken, Icon, makeStyles, Typography } from '@/shared/ui';

import type { Parcel } from '../model/parcel';
import { DeliveryStepper } from './delivery-stepper';
import { ParcelStatusBadge } from './parcel-status-badge';

export interface ParcelCardProps {
  parcel: Parcel;
  onRetrieve?: () => void;
  onReportLost?: () => void;
}

export function ParcelCard({ parcel, onRetrieve, onReportLost }: ParcelCardProps) {
  const styles = useStyles();
  const isOverdue = parcel.status === 'overdue';

  return (
    <Card style={[styles.card, isOverdue && styles.overdue]}>
      <View style={styles.header}>
        <View style={styles.titleCol}>
          <Typography variant="bodyMStrong" numberOfLines={1}>
            {parcel.name}
          </Typography>
          <Typography variant="bodyMStrong" color="textSecondary" numberOfLines={1}>
            {parcel.carrier} · {parcel.trackingNumber}
          </Typography>
        </View>
        <ParcelStatusBadge status={parcel.status} />
      </View>

      {parcel.status === 'claimed' ? (
        <View style={[styles.note, styles.noteMuted]}>
          <Icon name="infoMuted" />
          <Typography variant="bodyMStrong" color="textSecondary" style={styles.flex}>
            {parcel.claimedAt ? `${parcel.claimedAt}에 수령했어요.` : '수령을 완료했어요.'}
          </Typography>
        </View>
      ) : parcel.status === 'inTransit' ? (
        <>
          <DeliveryStepper current={parcel.stepIndex ?? 0} />
          <View style={styles.note}>
            <Icon name="info" />
            <Typography variant="bodyMStrong" color="textBrandStrong" style={styles.flex}>
              아직 도착 전이에요. 도착하면 바로 알려드릴게요.
            </Typography>
          </View>
        </>
      ) : (
        <>
          <View style={styles.meta}>
            <MetaBox label="보관 구역" value={`${parcel.zone ?? '-'}구역`} valueColor="textBrand" />
            <MetaBox
              label={`도착 ${parcel.arrivedAt ?? ''}`}
              value={parcel.timeLabel ?? ''}
              valueColor={isOverdue ? 'textDanger' : 'textPrimary'}
              danger={isOverdue}
            />
          </View>
          <View style={styles.actions}>
            <Button
              label="회수하기"
              variant="brand"
              size="m"
              style={styles.flex}
              onPress={onRetrieve}
            />
            <Button
              label="분실 신고"
              variant="dangerSoft"
              size="m"
              style={styles.flex}
              onPress={onReportLost}
            />
          </View>
        </>
      )}
    </Card>
  );
}

interface MetaBoxProps {
  label: string;
  value: string;
  valueColor: ColorToken;
  danger?: boolean;
}

function MetaBox({ label, value, valueColor, danger = false }: MetaBoxProps) {
  const styles = useStyles();

  return (
    <View style={[styles.metaBox, danger && styles.metaBoxDanger]}>
      <Typography variant="bodyMStrong" color="textTertiary" numberOfLines={1}>
        {label}
      </Typography>
      <Typography variant="bodyMStrong" color={valueColor} numberOfLines={1}>
        {value}
      </Typography>
    </View>
  );
}

const useStyles = makeStyles(({ colors, radius, spacing }) => ({
  // 테두리 두께를 항상 잡아 둬야 방치 카드와 일반 카드의 크기가 같다.
  card: { gap: spacing.md, borderWidth: 1.5, borderColor: 'transparent' },
  overdue: { borderColor: colors.borderDanger },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  titleCol: { flex: 1, gap: spacing['2xs'] },
  meta: { flexDirection: 'row', gap: spacing.sm },
  metaBox: {
    flex: 1,
    gap: spacing['2xs'],
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.bgSubtle,
  },
  metaBoxDanger: { backgroundColor: colors.bgDangerSoft },
  actions: { flexDirection: 'row', gap: spacing.sm },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.bgBrandSoft,
  },
  noteMuted: { backgroundColor: colors.bgSubtle },
  flex: { flex: 1 },
}));
