import { View } from 'react-native';

import { BrandSurface, makeStyles, Typography } from '@/shared/ui';

import type { ChatBubbleMessage } from '../model/chat';

export interface ChatBubbleProps {
  message: ChatBubbleMessage;
}

// Figma 말풍선 채움 각도 (270×70 비율)
const BUBBLE_GRADIENT_ANGLE = 166.46;

/** 내 메시지는 오른쪽 브랜드 그라디언트, 상대 메시지는 왼쪽 흰 말풍선. */
export function ChatBubble({ message }: ChatBubbleProps) {
  const styles = useStyles();

  return (
    <View style={[styles.row, message.isMine && styles.rowMine]}>
      {message.isMine ? (
        <BrandSurface angle={BUBBLE_GRADIENT_ANGLE} style={[styles.bubble, styles.bubbleMine]}>
          <Typography color="textOnBrand">{message.content}</Typography>
        </BrandSurface>
      ) : (
        <View style={[styles.bubble, styles.bubbleOther]}>
          <Typography>{message.content}</Typography>
        </View>
      )}
    </View>
  );
}

const useStyles = makeStyles(({ colors, radius, size, spacing }) => ({
  row: { flexDirection: 'row' },
  rowMine: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: size.bubbleMaxWidth,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  // 꼬리 쪽(보낸 사람 쪽 아래) 모서리만 작게 깎는다.
  bubbleMine: { borderBottomLeftRadius: radius.lg, borderBottomRightRadius: radius.xs },
  bubbleOther: {
    borderBottomLeftRadius: radius.xs,
    borderBottomRightRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.bgSurface,
  },
}));
