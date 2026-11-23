import { Pressable, View } from 'react-native';

import { makeStyles } from '../theme';
import { Typography } from '../typography';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** 화면 안 보기 전환 (Figma `Segmented 2`). 선택된 칸만 흰 배경 + 카드 그림자. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const styles = useStyles();

  return (
    <View style={styles.track} accessibilityRole="tablist">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => {
              if (!selected) onChange(option.value);
            }}
            style={[styles.segment, selected && styles.selected]}
          >
            <Typography color={selected ? 'textPrimary' : 'textSecondary'} numberOfLines={1}>
              {option.label}
            </Typography>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles(({ colors, radius, shadow, spacing }) => ({
  track: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: spacing.xs,
    padding: spacing.xs,
    borderRadius: radius.lg,
    backgroundColor: colors.bgNeutralSoft,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  selected: { backgroundColor: colors.bgSurface, ...shadow.card },
}));
