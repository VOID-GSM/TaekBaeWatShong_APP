import { Pressable, type PressableProps } from 'react-native';

import { Icon, type IconName } from '../icon';
import { makeStyles } from '../theme';

export interface IconButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  icon: IconName;
  accessibilityLabel: string;
}

/** 흰 원형(40) 아이콘 버튼. 예: 홈 헤더의 알림 버튼. */
export function IconButton({ icon, ...props }: IconButtonProps) {
  const styles = useStyles();

  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={4}
      {...props}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <Icon name={icon} />
    </Pressable>
  );
}

const useStyles = makeStyles(({ colors, opacity, radius, shadow, size }) => ({
  container: {
    width: size.iconButton,
    height: size.iconButton,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: colors.bgSurface,
    ...shadow.card,
  },
  pressed: { opacity: opacity.pressed },
}));
