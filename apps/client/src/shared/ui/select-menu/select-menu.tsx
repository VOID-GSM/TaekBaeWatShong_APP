import { type ComponentRef, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '../icon';
import { makeStyles } from '../theme';
import { Typography } from '../typography';

export interface SelectMenuOption<T extends string> {
  value: T;
  label: string;
}

export interface SelectMenuProps<T extends string> {
  value: T;
  options: readonly SelectMenuOption<T>[];
  onChange: (value: T) => void;
  /** 스크린리더용 이름. 예: '택배 정렬' */
  accessibilityLabel: string;
}

interface Anchor {
  top: number;
  right: number;
}

/** 현재 값 + ▾ 를 누르면 바로 아래에 옵션 목록이 뜨는 선택 메뉴. */
export function SelectMenu<T extends string>({
  value,
  options,
  onChange,
  accessibilityLabel,
}: SelectMenuProps<T>) {
  const styles = useStyles();
  const triggerRef = useRef<ComponentRef<typeof View>>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const current = options.find((option) => option.value === value);

  const open = () => {
    // 메뉴는 Modal 에 그리므로 트리거의 화면 좌표를 재서 그 아래에 붙인다.
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ top: y + height + 4, right: x + width });
    });
  };
  const close = () => setAnchor(null);

  const select = (next: T) => {
    close();
    if (next !== value) {
      onChange(next);
    }
  };

  return (
    <>
      <Pressable
        ref={triggerRef}
        accessibilityRole="button"
        accessibilityLabel={`${accessibilityLabel}: ${current?.label ?? ''}`}
        accessibilityState={{ expanded: anchor !== null }}
        hitSlop={8}
        onPress={open}
        style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}
      >
        <Typography variant="bodyMStrong" color="textTertiary">
          {current?.label}
        </Typography>
        <Icon name="chevronDown" />
      </Pressable>

      {/* measureInWindow 는 상태 표시줄을 포함한 좌표라, Android Modal 도 상태 표시줄부터 그리게 맞춘다. */}
      <Modal
        visible={anchor !== null}
        transparent
        statusBarTranslucent
        animationType="fade"
        onRequestClose={close}
      >
        {/* 배경은 메뉴의 형제로 둔다. 메뉴를 감싸면 iOS VoiceOver 가 하나로 묶어 항목에 못 간다. */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel="메뉴 닫기"
        />
        {anchor !== null && (
          <View
            accessibilityRole="menu"
            style={[styles.menu, { top: anchor.top, left: anchor.right }]}
          >
            {options.map((option) => {
              const selected = option.value === value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="menuitem"
                  accessibilityState={{ selected }}
                  onPress={() => select(option.value)}
                  style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
                >
                  <Typography
                    variant="bodyMStrong"
                    color={selected ? 'textBrand' : 'textPrimary'}
                    style={styles.flex}
                  >
                    {option.label}
                  </Typography>
                  {selected && <Icon name="check" />}
                </Pressable>
              );
            })}
          </View>
        )}
      </Modal>
    </>
  );
}

const MENU_WIDTH = 148;

const useStyles = makeStyles(({ colors, opacity, radius, shadow, spacing }) => ({
  trigger: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  pressed: { opacity: opacity.pressed },
  menu: {
    position: 'absolute',
    width: MENU_WIDTH,
    // 트리거 오른쪽 끝에 메뉴 오른쪽 끝을 맞춘다.
    marginLeft: -MENU_WIDTH,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.bgSurface,
    ...shadow.card,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  itemPressed: { backgroundColor: colors.bgSubtle },
  flex: { flex: 1 },
}));
