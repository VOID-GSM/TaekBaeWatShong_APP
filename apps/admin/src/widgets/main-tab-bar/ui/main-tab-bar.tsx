import { Pressable, type PressableProps, View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

import { BrandSurface, makeStyles, useTheme } from '@/shared/ui';

/**
 * 하단 탭 바 틀 (Figma `TabBar/Admin`). expo-router 의 `<TabList asChild>` 안에 넣는다.
 * 시안의 홈 인디케이터 영역은 기기 SafeArea 아래 여백으로 대신한다.
 */
export function MainTabBar({ style, children, ...props }: ViewProps) {
  const styles = useStyles();
  const { spacing } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      {...props}
      // TabList 가 넘기는 기본 스타일(가로 정렬)은 안쪽 row 가 맡으므로 바깥 틀 스타일로 덮는다.
      style={[style, styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}
    >
      <View style={styles.row}>{children}</View>
    </View>
  );
}

export interface MainTabButtonProps extends Omit<PressableProps, 'children'> {
  /** `currentColor` 로 선 색을 받는 SVG 문자열 */
  icon: string;
  /** 스크린 리더용 이름. 시안에 글자 라벨이 없다. */
  label: string;
  /** 아이콘 오른쪽 위 빨간 점. 새 알림·신고가 있을 때만 켠다. */
  showDot?: boolean;
  /** `<TabTrigger asChild>` 가 넣어 준다. */
  isFocused?: boolean;
  /** `<TabTrigger asChild>` 가 넣어 주지만 이동은 onPress 가 처리하므로 쓰지 않는다. */
  href?: string;
}

// React 19 는 ref 를 일반 prop 으로 넘겨 forwardRef 가 필요 없다. TabTrigger asChild 의 ref 는 props 로 들어온다.
export function MainTabButton({
  icon,
  label,
  showDot = false,
  isFocused = false,
  href: _href,
  style,
  ...props
}: MainTabButtonProps) {
  const styles = useStyles();
  const { colors, size } = useTheme();
  const iconNode = (
    <>
      <SvgXml
        xml={icon}
        width={size.iconM}
        height={size.iconM}
        color={isFocused ? colors.textOnBrand : colors.textTertiary}
      />
      {showDot && <View style={styles.dot} />}
    </>
  );

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={showDot ? `${label}, 새 항목 있음` : label}
      accessibilityState={{ selected: isFocused }}
      {...props}
      // TabTrigger 가 넘기는 기본 스타일(가로·양끝 정렬)은 시안과 달라 이 버튼 스타일로 덮는다.
      style={(state) => [
        typeof style === 'function' ? style(state) : style,
        styles.tab,
        state.pressed && styles.pressed,
      ]}
    >
      {isFocused ? (
        <BrandSurface angle={149} style={styles.pill}>
          {iconNode}
        </BrandSurface>
      ) : (
        <View style={styles.pill}>{iconNode}</View>
      )}
    </Pressable>
  );
}

// 점 지름 7 + 양쪽 테두리 2
const DOT_SIZE = 11;

const useStyles = makeStyles(({ colors, opacity, radius, shadow, size, spacing }) => ({
  bar: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderTopWidth: 1,
    borderColor: colors.borderDefault,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    backgroundColor: colors.bgSurface,
    ...shadow.floatUp,
  },
  // 아래 6 은 시안 값(변수 없음). 그 밑 홈 인디케이터 자리는 bar 의 SafeArea 여백이 맡는다.
  row: { flexDirection: 'row', paddingTop: spacing.mdPlus, paddingBottom: 6 },
  tab: { flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' },
  pill: {
    width: size.tabPillWidth,
    height: size.tabPillHeight,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  // Figma `Pill` 의 Dot: 지름 7 + 흰 테두리 2, 알약 기준 중심 (37.5, 6.5)
  dot: {
    position: 'absolute',
    top: 6.5 - DOT_SIZE / 2,
    left: 37.5 - DOT_SIZE / 2,
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.bgSurface,
    backgroundColor: colors.textDanger,
  },
  pressed: { opacity: opacity.pressed },
}));
