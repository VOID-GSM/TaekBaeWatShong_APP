import { Pressable, View } from 'react-native';

import { makeStyles, Typography } from '@/shared/ui';

import { PARCEL_ZONES, type ParcelZone } from '../model/arrival-scan';

export interface ZonePickerProps {
  value: ParcelZone | null;
  onChange: (zone: ParcelZone | null) => void;
}

const OPTIONS: readonly { value: ParcelZone | null; label: string; a11yLabel: string }[] = [
  { value: null, label: '선택 안 함', a11yLabel: '구역 선택 안 함' },
  ...PARCEL_ZONES.map((zone) => ({ value: zone, label: zone, a11yLabel: `${zone} 구역` })),
];

/** 도착 처리하면서 함께 저장할 보관 구역. 고르지 않으면 구역을 바꾸지 않는다. */
export function ZonePicker({ value, onChange }: ZonePickerProps) {
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Typography variant="bodyMStrong">보관 구역</Typography>
        <Typography variant="caption" color="textSecondary">
          고른 구역으로 함께 저장돼요
        </Typography>
      </View>
      <View style={styles.options} accessibilityRole="radiogroup" accessibilityLabel="보관 구역">
        {OPTIONS.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.label}
              accessibilityRole="radio"
              accessibilityLabel={option.a11yLabel}
              accessibilityState={{ selected, checked: selected }}
              onPress={() => {
                if (!selected) onChange(option.value);
              }}
              style={({ pressed }) => [
                styles.option,
                option.value === null && styles.optionWide,
                selected && styles.selected,
                pressed && !selected && styles.pressed,
              ]}
            >
              <Typography
                variant={option.value === null ? 'bodyMStrong' : 'headingH1'}
                color={selected ? 'textOnBrand' : 'textPrimary'}
                numberOfLines={1}
              >
                {option.label}
              </Typography>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const useStyles = makeStyles(({ colors, opacity, radius, size, spacing }) => ({
  container: { alignSelf: 'stretch', gap: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: spacing.sm },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  option: {
    minWidth: size.buttonL,
    minHeight: size.buttonL,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radius.md,
    backgroundColor: colors.bgSurface,
  },
  optionWide: { paddingHorizontal: spacing.lg },
  selected: { borderColor: colors.textBrand, backgroundColor: colors.textBrand },
  pressed: { opacity: opacity.pressed },
}));
