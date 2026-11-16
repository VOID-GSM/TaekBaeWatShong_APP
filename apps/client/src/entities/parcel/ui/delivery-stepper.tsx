import { Fragment } from 'react';
import { View } from 'react-native';

import { BrandSurface, Icon, makeStyles, Typography } from '@/shared/ui';

import { DELIVERY_STEPS } from '../model/parcel';

export interface DeliveryStepperProps {
  /** 현재 단계 인덱스 (DELIVERY_STEPS 기준) */
  current: number;
}

export function DeliveryStepper({ current }: DeliveryStepperProps) {
  const styles = useStyles();

  return (
    <View
      style={styles.container}
      accessible
      accessibilityLabel={`배송 단계 ${DELIVERY_STEPS[current] ?? ''}`}
    >
      <View style={styles.dots}>
        {DELIVERY_STEPS.map((step, index) => (
          <Fragment key={step}>
            {index > 0 &&
              (index <= current ? (
                <BrandSurface angle={177.92} style={styles.line} />
              ) : (
                <View style={[styles.line, styles.lineTodo]} />
              ))}
            {index === current ? (
              // 현재 점은 14 크기에 4px 링이 바깥으로 넘친다(SVG 22).
              <View style={styles.currentDot}>
                <Icon name="stepDotCurrent" />
              </View>
            ) : (
              <Icon name={index < current ? 'stepDotDone' : 'stepDotTodo'} />
            )}
          </Fragment>
        ))}
      </View>
      <View style={styles.labels}>
        {DELIVERY_STEPS.map((step, index) => (
          <Typography
            key={step}
            variant="bodyMStrong"
            color={index === current ? 'textBrand' : 'textTertiary'}
          >
            {step}
          </Typography>
        ))}
      </View>
    </View>
  );
}

const useStyles = makeStyles(({ colors, spacing }) => ({
  container: { gap: spacing.sm },
  dots: { flexDirection: 'row', alignItems: 'center' },
  line: { flex: 1, height: 3, borderRadius: 2 },
  lineTodo: { backgroundColor: colors.borderDefault },
  currentDot: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
}));
