import { View } from 'react-native';

import { makeStyles, Typography } from '@/shared/ui';

export interface ChatAvatarProps {
  name: string;
  /** s: 채팅방 헤더(40), m: 채팅 목록(44) */
  size?: 's' | 'm';
}

/** 이름 첫 글자를 보여 주는 원형 아바타. 이름이 바로 옆에 있어 스크린 리더에서는 숨긴다. */
export function ChatAvatar({ name, size = 'm' }: ChatAvatarProps) {
  const styles = useStyles();
  // 서로게이트 쌍(이모지 등)이 반으로 잘리지 않게 코드 포인트 단위로 자른다.
  const initial = Array.from(name.trim())[0] ?? '';

  return (
    <View
      style={[styles.container, styles[size]]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Typography variant={size === 'm' ? 'bodyL' : 'bodyM'} color="textBrand">
        {initial}
      </Typography>
    </View>
  );
}

const useStyles = makeStyles(({ colors, radius, size }) => ({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: colors.bgBrandSoft,
  },
  s: { width: size.avatarM, height: size.avatarM },
  m: { width: size.avatarL, height: size.avatarL },
}));
