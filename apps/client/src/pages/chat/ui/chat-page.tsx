import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SectionList,
  type SectionListRenderItem,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChatBubble, type ChatBubbleMessage, ChatDateDivider } from '@/entities/chat';
import { ChatInputBar } from '@/features/send-chat-message';
import { Button, makeStyles, Typography, useTheme } from '@/shared/ui';

import { NO_STAFF_MESSAGE, useStaffChat } from '../model/use-staff-chat';
import { ChatHeader } from './chat-header';

interface DateSection {
  date: string;
  data: ChatBubbleMessage[];
}

const renderItem: SectionListRenderItem<ChatBubbleMessage, DateSection> = ({ item }) => (
  <ChatBubble message={item} />
);

/** 학생 ↔ 학생생활안전부 1:1 채팅 (시안 C11). */
export function ChatPage() {
  const styles = useStyles();
  const { colors } = useTheme();
  const listRef = useRef<SectionList<ChatBubbleMessage, DateSection>>(null);
  const { partner, sections, isPending, error, send, isSending, refetch } = useStaffChat();
  const [sendError, setSendError] = useState<string | null>(null);

  const listSections = useMemo<DateSection[]>(
    () => sections.map((section) => ({ date: section.date, data: section.messages })),
    [sections],
  );

  const handleSend = useCallback(
    async (content: string) => {
      setSendError(null);
      try {
        await send(content);
      } catch (cause) {
        setSendError(cause instanceof Error ? cause.message : '');
        // 입력창이 내용을 지우지 않도록 실패를 그대로 넘긴다.
        throw cause;
      }
    },
    [send],
  );

  const scrollToEnd = () => {
    const lastSection = listSections.length - 1;
    const lastItem = listSections[lastSection]?.data.length;
    if (lastSection < 0 || !lastItem) return;
    listRef.current?.scrollToLocation({
      sectionIndex: lastSection,
      itemIndex: lastItem - 1,
      viewPosition: 1,
      animated: true,
    });
  };

  const renderBody = () => {
    if (isPending) {
      return (
        <View style={styles.center}>
          <ActivityIndicator color={colors.textBrand} accessibilityLabel="대화 불러오는 중" />
        </View>
      );
    }
    if (error) {
      return (
        <View style={[styles.center, styles.message]}>
          <Typography variant="bodyMStrong" align="center" accessibilityRole="alert">
            대화를 불러오지 못했어요.
          </Typography>
          <Typography color="textSecondary" align="center">
            {error.message}
          </Typography>
          <Button
            label="다시 시도"
            variant="outline"
            size="m"
            onPress={refetch}
            style={styles.retry}
          />
        </View>
      );
    }
    if (partner === null) {
      return (
        <View style={[styles.center, styles.message]}>
          <Typography color="textSecondary" align="center">
            {NO_STAFF_MESSAGE}
          </Typography>
        </View>
      );
    }
    return (
      <SectionList
        ref={listRef}
        sections={listSections}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        renderSectionHeader={({ section }) => <ChatDateDivider label={section.date} />}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={[styles.content, listSections.length === 0 && styles.grow]}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Typography color="textTertiary" align="center">
            궁금한 점을 남겨 주세요
          </Typography>
        }
        // 새 메시지가 붙으면 맨 아래로 내린다.
        onContentSizeChange={scrollToEnd}
        // 레이아웃 전 scrollToLocation 이 실패하면 무시한다(다음 콘텐츠 변경 때 다시 내린다).
        onScrollToIndexFailed={() => {}}
      />
    );
  };

  const canSend = !isPending && error === null && partner !== null;

  return (
    // 아래 SafeArea 여백은 하단 탭 바가 맡는다.
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ChatHeader />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {renderBody()}
        {sendError !== null && (
          <Typography
            variant="caption"
            color="textDanger"
            accessibilityRole="alert"
            style={styles.sendError}
          >
            {`메시지를 보내지 못했어요. ${sendError}`}
          </Typography>
        )}
        <ChatInputBar onSend={handleSend} disabled={!canSend || isSending} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles(({ colors, spacing }) => ({
  screen: { flex: 1, backgroundColor: colors.bgApp },
  flex: { flex: 1 },
  content: { gap: spacing.smPlus, padding: spacing.lg },
  grow: { flexGrow: 1, justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  message: { gap: spacing.sm, paddingHorizontal: spacing['2xl'] },
  retry: { marginTop: spacing.lg },
  sendError: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xs },
}));
