import { Pressable, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { chevronLeftXml } from '../../assets/chevron-left';
import { makeStyles, useTheme } from '../theme';
import { Typography } from '../typography';

export interface ScreenHeaderProps {
  title: string;
  /** 있으면 왼쪽에 뒤로가기 버튼을 그린다. */
  onBack?: () => void;
}

/** 뒤로가기 + 가운데 제목 헤더 (시안 C9). 위쪽 SafeArea 는 화면이 맡는다. */
export function ScreenHeader({ title, onBack }: ScreenHeaderProps) {
  const styles = useStyles();
  const { colors, size } = useTheme();

  return (
    <View style={styles.container}>
      {onBack !== undefined && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="뒤로 가기"
          onPress={onBack}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        >
          <SvgXml
            xml={chevronLeftXml}
            width={size.iconM}
            height={size.iconM}
            color={colors.iconStrong}
          />
        </Pressable>
      )}
      <Typography variant="bodyMStrong" align="center" numberOfLines={1} accessibilityRole="header">
        {title}
      </Typography>
    </View>
  );
}

const useStyles = makeStyles(({ opacity, size, spacing }) => ({
  container: {
    height: size.header,
    alignItems: 'center',
    justifyContent: 'center',
    // 제목이 뒤로가기 버튼과 겹치지 않게 양쪽을 버튼 폭만큼 비운다.
    paddingHorizontal: spacing.xs + size.touchTarget,
  },
  // 아이콘 왼쪽 끝이 화면 가장자리에서 spacing.lg 가 되도록, 44×44 터치 영역을 안쪽으로 당긴다.
  back: {
    position: 'absolute',
    left: spacing.lg - (size.touchTarget - size.iconM) / 2,
    top: (size.header - size.touchTarget) / 2,
    width: size.touchTarget,
    height: size.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: opacity.pressed },
}));
