import { useState } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { BrandGradient } from '../brand-surface';
import { makeStyles } from '../theme';
import { Typography } from '../typography';

export interface ChipProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
}

// Figma Chip 선택 채움 각도
const SELECTED_GRADIENT_ANGLE = 156.85;

/** 여러 개 중 하나를 고르는 알약 모양 선택지 (Figma `Chip`). */
export function Chip({ label, selected = false, style, ...props }: ChipProps) {
  const styles = useStyles();
  const [layout, setLayout] = useState({ width: 0, height: 0 });

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      {...props}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setLayout((prev) =>
          prev.width === width && prev.height === height ? prev : { width, height },
        );
        props.onLayout?.(event);
      }}
      style={({ pressed }) => [
        styles.container,
        selected ? styles.selected : styles.unselected,
        pressed && styles.pressed,
        style,
      ]}
    >
      {selected && layout.width > 0 && (
        <BrandGradient {...layout} angle={SELECTED_GRADIENT_ANGLE} />
      )}
      <Typography variant="bodyMStrong" color={selected ? 'textOnBrand' : 'textSecondary'}>
        {label}
      </Typography>
    </Pressable>
  );
}

const useStyles = makeStyles(({ colors, opacity, radius, spacing }) => ({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    // 선택 여부와 관계없이 높이를 같게 두려고 테두리 두께를 항상 확보한다.
    borderWidth: 1,
    borderRadius: radius.full,
    overflow: 'hidden',
    zIndex: 0,
  },
  selected: { borderColor: 'transparent', backgroundColor: colors.bgBrandEnd },
  unselected: { borderColor: colors.borderDefault, backgroundColor: colors.bgSurface },
  pressed: { opacity: opacity.pressed },
}));
