import { Pressable, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { ChatAvatar } from '@/entities/chat';
import { chevronLeftXml } from '@/shared/assets/chevron-left';
import { makeStyles, Typography, useTheme } from '@/shared/ui';

export interface ChatRoomHeaderProps {
  /** 상대를 아직 모르면(불러오는 중) 아바타·이름을 비운다. */
  partner?: { isStaff: boolean; name: string; label: string };
  onBack: () => void;
}

/**
 * 학생 채팅방 헤더 (시안 C11 `Chat header` + 뒤로가기). 위쪽 SafeArea 는 화면이 맡는다.
 * 시안의 "● 온라인"은 서버에 접속 상태가 없어 그리지 않는다.
 */
export function ChatRoomHeader({ partner, onBack }: ChatRoomHeaderProps) {
  const styles = useStyles();
  const { colors, size } = useTheme();
  const title = partner
    ? partner.label
      ? `${partner.name} · ${partner.label}`
      : partner.name
    : '';

  return (
    <View style={styles.container}>
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
      {partner && <ChatAvatar name={partner.name} isStaff={partner.isStaff} size="s" />}
      <Typography
        variant="bodyMStrong"
        numberOfLines={1}
        accessibilityRole="header"
        style={styles.name}
      >
        {title}
      </Typography>
    </View>
  );
}

const useStyles = makeStyles(({ colors, opacity, size, spacing }) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: size.header,
    paddingVertical: spacing.md,
    paddingLeft: spacing.xs,
    paddingRight: spacing.lg,
    backgroundColor: colors.bgSurface,
  },
  back: {
    width: size.touchTarget,
    height: size.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: opacity.pressed },
  name: { flex: 1 },
}));
