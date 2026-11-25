import { useState } from 'react';
import { Pressable, type StyleProp, TextInput, View, type ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { sendXml } from '@/shared/assets/send';
import { BrandSurface, makeStyles, useTheme } from '@/shared/ui';

/** 서버 검증(`sendChatMessageRequestSchema`)과 같은 최대 길이. */
export const CHAT_MESSAGE_MAX_LENGTH = 1000;

export interface ChatInputBarProps {
  /**
   * 앞뒤 공백을 뗀 메시지. 빈 문자열이면 호출되지 않는다.
   * Promise 를 돌려주면 끝날 때까지 입력을 막고, 성공하면 입력을 비운다. 실패하면 입력을 그대로 둔다.
   */
  onSend: (content: string) => Promise<void> | void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** 채팅 입력창 + 전송 버튼 (Figma `Input bar`). */
export function ChatInputBar({ onSend, disabled = false, style }: ChatInputBarProps) {
  const styles = useStyles();
  const { colors, size } = useTheme();
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const trimmed = text.trim();
  const isLocked = disabled || isSending;
  const canSend = !isLocked && trimmed.length > 0;

  const handleSend = async () => {
    if (!canSend) return;
    setIsSending(true);
    try {
      await onSend(trimmed);
      setText('');
    } catch {
      // 실패 문구는 화면이 보여 준다. 다시 보낼 수 있게 입력은 남긴다.
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <TextInput
        accessibilityLabel="메시지 입력"
        placeholder="메시지 입력…"
        placeholderTextColor={colors.textTertiary}
        value={text}
        onChangeText={setText}
        editable={!isLocked}
        maxLength={CHAT_MESSAGE_MAX_LENGTH}
        multiline
        submitBehavior="submit"
        returnKeyType="send"
        onSubmitEditing={() => void handleSend()}
        style={styles.field}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="메시지 보내기"
        accessibilityState={{ disabled: !canSend, busy: isSending }}
        disabled={!canSend}
        onPress={() => void handleSend()}
        // 시안은 빈 입력에서도 전송 버튼을 흐리게 하지 않아 모양은 그대로 두고 동작만 막는다.
        style={({ pressed }) => pressed && styles.pressed}
      >
        <BrandSurface style={styles.send}>
          <SvgXml
            xml={sendXml}
            width={size.iconSend}
            height={size.iconSend}
            color={colors.textOnBrand}
          />
        </BrandSurface>
      </Pressable>
    </View>
  );
}

/** 입력칸이 여러 줄로 늘어날 때 멈추는 줄 수 */
const MAX_LINES = 4;

const useStyles = makeStyles(({ colors, opacity, radius, size, spacing, typography }) => {
  const text = typography.bodyM;
  // 한 줄일 때 글자가 입력칸 높이 가운데에 오도록 위아래 여백을 정한다.
  const paddingVertical = (size.chatInput - text.lineHeight) / 2;

  return {
    container: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.sm,
      padding: spacing.md,
      backgroundColor: colors.bgSurface,
    },
    field: {
      flex: 1,
      minHeight: size.chatInput,
      maxHeight: text.lineHeight * MAX_LINES + paddingVertical * 2,
      paddingHorizontal: spacing.lg,
      paddingVertical,
      textAlignVertical: 'center',
      borderRadius: size.chatInput / 2,
      backgroundColor: colors.bgNeutralSoft,
      color: colors.textPrimary,
      ...text,
    },
    send: {
      width: size.chatInput,
      height: size.chatInput,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.full,
    },
    pressed: { opacity: opacity.pressed },
  };
});
