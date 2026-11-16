import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GradientView } from '../gradient-view';
import { Icon, type IconName } from '../icon';
import { makeStyles } from '../theme';

export interface TabBarItem<K extends string> {
  key: K;
  /** 스크린 리더용 이름 (시안에 글자 라벨은 없다) */
  label: string;
  icon: IconName;
}

export interface TabBarProps<K extends string> {
  items: readonly TabBarItem<K>[];
  activeKey: K;
  onTabPress: (key: K) => void;
}

/**
 * 하단 탭바(Figma `TabBar/Client`). 위쪽 모서리 20 · Shadow/Float-Up · 아이콘 pill(56×30).
 * 활성 탭은 브랜드 그라데이션 pill 로 표시한다.
 */
export function TabBar<K extends string>({ items, activeKey, onTabPress }: TabBarProps<K>) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();

  return (
    <View
      accessibilityRole="tablist"
      // 시안의 홈 인디케이터 영역(21). 기기 하단 안전 영역이 더 크면 그만큼 띄운다.
      style={[styles.container, { paddingBottom: Math.max(insets.bottom, HOME_INDICATOR_SPACE) }]}
    >
      <View style={styles.tabs}>
        {items.map(({ key, label, icon }) => {
          const isActive = key === activeKey;
          return (
            <Pressable
              key={key}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected: isActive }}
              onPress={() => onTabPress(key)}
              style={styles.tab}
            >
              {isActive ? (
                <GradientView gradient="brand" style={[styles.pill, styles.pillActive]}>
                  <Icon name={icon} />
                </GradientView>
              ) : (
                <View style={styles.pill}>
                  <Icon name={icon} />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const HOME_INDICATOR_SPACE = 21;

const useStyles = makeStyles(({ colors, radius, shadow, size, spacing }) => ({
  container: {
    alignSelf: 'stretch',
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderTopWidth: 1,
    borderColor: colors.borderDefault,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    backgroundColor: colors.bgSurface,
    ...shadow.floatUp,
  },
  tabs: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: spacing.mdPlus,
    paddingBottom: spacing.xsPlus,
  },
  tab: { flex: 1, alignItems: 'center' },
  pill: {
    width: size.tabPillWidth,
    height: size.tabPillHeight,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  pillActive: { borderRadius: size.tabPillHeight / 2 },
}));
