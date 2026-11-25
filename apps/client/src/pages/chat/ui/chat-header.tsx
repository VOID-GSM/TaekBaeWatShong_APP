import { View } from 'react-native';

import { BrandSurface, makeStyles, Typography } from '@/shared/ui';

/**
 * 학생 채팅 헤더 (시안 C11 `Chat header`). 상대는 늘 학생생활안전부라 문구를 고정한다.
 * 시안의 "● 온라인"은 서버에 접속 상태가 없어 그리지 않는다.
 */
export function ChatHeader() {
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <BrandSurface
        style={styles.avatar}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Typography variant="bodyMStrong" color="textOnBrand">
          관리
        </Typography>
      </BrandSurface>
      <Typography
        variant="bodyMStrong"
        numberOfLines={1}
        accessibilityRole="header"
        style={styles.name}
      >
        학생생활안전부
      </Typography>
    </View>
  );
}

const useStyles = makeStyles(({ colors, radius, size, spacing }) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.bgSurface,
  },
  avatar: {
    width: size.avatarM,
    height: size.avatarM,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  name: { flex: 1 },
}));
