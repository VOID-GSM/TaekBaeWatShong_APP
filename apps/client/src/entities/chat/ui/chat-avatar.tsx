import { View } from 'react-native';

import { BrandSurface, makeStyles, Typography } from '@/shared/ui';

export interface ChatAvatarProps {
  name: string;
  /** 학생생활안전부면 브랜드 배경에 `관리`(시안 C11 헤더) */
  isStaff?: boolean;
  /** s: 채팅방 헤더(40), m: 채팅 목록(44) */
  size?: 's' | 'm';
}

/** 이름 첫 글자를 보여 주는 원형 아바타. 이름이 바로 옆에 있어 스크린 리더에서는 숨긴다. */
export function ChatAvatar({ name, isStaff = false, size = 'm' }: ChatAvatarProps) {
  const styles = useStyles();
  const a11yHidden = {
    accessibilityElementsHidden: true,
    importantForAccessibility: 'no-hide-descendants',
  } as const;

  if (isStaff) {
    return (
      <BrandSurface style={[styles.container, styles[size]]} {...a11yHidden}>
        <Typography variant="bodyMStrong" color="textOnBrand">
          관리
        </Typography>
      </BrandSurface>
    );
  }

  // 서로게이트 쌍(이모지 등)이 반으로 잘리지 않게 코드 포인트 단위로 자른다.
  const initial = Array.from(name.trim())[0] ?? '';
  return (
    <View style={[styles.container, styles.soft, styles[size]]} {...a11yHidden}>
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
    overflow: 'hidden',
  },
  soft: { backgroundColor: colors.bgBrandSoft },
  s: { width: size.avatarM, height: size.avatarM },
  m: { width: size.avatarL, height: size.avatarL },
}));
