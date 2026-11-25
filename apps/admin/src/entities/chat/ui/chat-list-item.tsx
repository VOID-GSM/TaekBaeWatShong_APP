import { Pressable, type PressableProps, View } from 'react-native';

import { BrandSurface, makeStyles, Typography } from '@/shared/ui';

import type { ChatRoomSummary } from '../model/chat';
import { ChatAvatar } from './chat-avatar';

export interface ChatListItemProps extends Omit<PressableProps, 'children' | 'style'> {
  room: ChatRoomSummary;
}

/** 안 읽음 배지에 보여 줄 최대 개수. 넘으면 `99+`. */
const MAX_UNREAD_LABEL = 99;

/** 1:1 채팅 목록 카드 (Figma `ChatListItem`). */
export function ChatListItem({ room, ...props }: ChatListItemProps) {
  const styles = useStyles();
  const title = room.partnerLabel ? `${room.partnerName} · ${room.partnerLabel}` : room.partnerName;
  const lastMessage = room.lastMessage || '아직 메시지가 없어요';
  const hasUnread = room.unreadCount > 0;
  const unreadLabel =
    room.unreadCount > MAX_UNREAD_LABEL ? `${MAX_UNREAD_LABEL}+` : String(room.unreadCount);
  const a11yLabel = [
    title,
    lastMessage,
    room.lastMessageAt,
    hasUnread ? `안 읽은 메시지 ${room.unreadCount}개` : null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      {...props}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <ChatAvatar name={room.partnerName} size="m" />
      <View style={styles.texts}>
        <Typography numberOfLines={1}>{title}</Typography>
        {/* 안 읽은 메시지가 있으면 마지막 메시지를 진하게 보여 준다. */}
        <Typography
          variant="caption"
          color={hasUnread ? 'textPrimary' : 'textSecondary'}
          numberOfLines={1}
        >
          {lastMessage}
        </Typography>
      </View>
      <View style={styles.meta}>
        {room.lastMessageAt !== null && (
          <Typography variant="micro" color="textTertiary">
            {room.lastMessageAt}
          </Typography>
        )}
        {hasUnread && (
          <BrandSurface style={styles.unread}>
            <Typography variant="micro" color="textOnBrand">
              {unreadLabel}
            </Typography>
          </BrandSurface>
        )}
      </View>
    </Pressable>
  );
}

const useStyles = makeStyles(({ colors, opacity, radius, shadow, size, spacing }) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: size.chatListItem,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.bgSurface,
    ...shadow.card,
  },
  pressed: { opacity: opacity.pressed },
  texts: { flex: 1, gap: spacing['2xs'] },
  meta: { alignItems: 'flex-end', gap: spacing.xsPlus },
  unread: {
    minWidth: size.unreadBadge,
    height: size.unreadBadge,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
}));
