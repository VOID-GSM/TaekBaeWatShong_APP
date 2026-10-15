import { Pressable, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { chevronLeftXml } from '../../assets/chevron-left';
import { makeStyles, useTheme } from '../theme';
import { Typography } from '../typography';

export interface TopBarProps {
  title: string;
  onBack?: () => void;
}

export function TopBar({ title, onBack }: TopBarProps) {
  const styles = useStyles();
  const { size } = useTheme();

  return (
    <View style={styles.container}>
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
          onPress={onBack}
          // 시안 크기(40pt)를 유지하면서 터치 영역을 최소 44pt로 넓힌다.
          hitSlop={4}
          style={({ pressed }) => [styles.side, pressed && styles.pressed]}
        >
          <SvgXml xml={chevronLeftXml} width={size.iconL} height={size.iconL} />
        </Pressable>
      ) : (
        <View style={styles.side} />
      )}
      <Typography
        variant="headingH2"
        align="center"
        numberOfLines={1}
        accessibilityRole="header"
        style={styles.title}
      >
        {title}
      </Typography>
      {/* 제목을 가운데에 두기 위한 오른쪽 여백 */}
      <View style={styles.side} />
    </View>
  );
}

const useStyles = makeStyles(({ opacity, size, spacing }) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: size.topBar,
    paddingHorizontal: spacing.sm,
  },
  side: {
    width: size.iconButton,
    height: size.iconButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: opacity.pressed },
  title: { flex: 1 },
}));
