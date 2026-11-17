import {
  Pressable,
  type PressableProps,
  type StyleProp,
  StyleSheet,
  type ViewStyle,
} from 'react-native';

import { BrandSurface } from '../brand-surface';
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

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      {...props}
      style={({ pressed }) => [
        styles.container,
        selected ? styles.selected : styles.unselected,
        pressed && styles.pressed,
        style,
      ]}
    >
      {selected && <BrandSurface angle={SELECTED_GRADIENT_ANGLE} style={styles.gradient} />}
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
  // 투명 테두리 1px 아래로 배경이 비치지 않게 그라디언트 끝 색을 깔아 둔다.
  selected: { borderColor: 'transparent', backgroundColor: colors.bgBrandEnd },
  // 웹은 absolute 요소가 일반 자식 위에 그려져 라벨을 덮으므로 뒤로 보낸다.
  gradient: { ...StyleSheet.absoluteFill, zIndex: -1 },
  unselected: { borderColor: colors.borderDefault, backgroundColor: colors.bgSurface },
  pressed: { opacity: opacity.pressed },
}));
