import { Pressable, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { ChatAvatar } from '@/entities/chat';
import { chevronLeftXml } from '@/shared/assets/chevron-left';
import { makeStyles, Typography, useTheme } from '@/shared/ui';

export interface ChatRoomHeaderProps {
  name: string;
  /** `이름 · 학번` / `이름 · 선생님` */
  title: string;
  /** `별칭 · 운송장`. 연결된 신고가 없으면 숨긴다. */
  subtitle?: string;
  onBack: () => void;
}

/** 채팅방 헤더 (시안 A9 `Chat header`). 위쪽 SafeArea 는 화면이 맡는다. */
export function ChatRoomHeader({ name, title, subtitle, onBack }: ChatRoomHeaderProps) {
  const styles = useStyles();
  const { size } = useTheme();

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="뒤로가기"
        onPress={onBack}
        // 시안 크기(40pt)를 유지하면서 터치 영역을 최소 44pt로 넓힌다.
        hitSlop={4}
        style={({ pressed }) => [styles.back, pressed && styles.pressed]}
      >
        <SvgXml xml={chevronLeftXml} width={size.iconL} height={size.iconL} />
      </Pressable>
      <ChatAvatar name={name} size="s" />
      <View style={styles.texts}>
        <Typography numberOfLines={1} accessibilityRole="header">
          {title}
        </Typography>
        {subtitle !== undefined && (
          <Typography variant="caption" color="textSecondary" numberOfLines={1}>
            {subtitle}
          </Typography>
        )}
      </View>
    </View>
  );
}

const useStyles = makeStyles(({ colors, opacity, size, spacing }) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.smPlus,
    paddingLeft: spacing.sm,
    paddingRight: spacing.lg,
    backgroundColor: colors.bgSurface,
  },
  back: {
    width: size.iconButton,
    height: size.iconButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: opacity.pressed },
  texts: { flex: 1 },
}));
