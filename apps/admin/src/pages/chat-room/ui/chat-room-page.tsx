import { ApiError } from '@taekbae/api';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  type ListRenderItem,
  Platform,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChatBubble, type ChatBubbleMessage } from '@/entities/chat';
import { formatLostAt, formatReporter, formatWaybill } from '@/entities/lost-report';
import { ChatInputBar } from '@/features/send-chat-message';
import { Button, makeStyles, TopBar, Typography, useTheme } from '@/shared/ui';

import { useChatRoom } from '../model/use-chat-room';
import { ChatRoomHeader } from './chat-room-header';
import { ReportBanner } from './report-banner';

export interface ChatRoomPageProps {
  roomId: number;
  /** 신고 목록에서 채팅을 시작했을 때 그 신고. 배너·부제에 쓴다. */
  reportId?: number;
  onBack: () => void;
}

const renderItem: ListRenderItem<ChatBubbleMessage> = ({ item }) => <ChatBubble message={item} />;

/** 403(남의 방)·404(없는 방)는 다시 시도해도 소용없어 따로 안내한다. */
const isMissingRoom = (error: Error | null) =>
  error instanceof ApiError && (error.status === 403 || error.status === 404);

/** 관리자 1:1 채팅방 (시안 A9). */
export function ChatRoomPage({ roomId, reportId, onBack }: ChatRoomPageProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const listRef = useRef<FlatList<ChatBubbleMessage>>(null);
  const { room, report, messages, isPending, error, send, refetch } = useChatRoom(roomId, reportId);
  const [sendError, setSendError] = useState<string | null>(null);

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

  // 방 정보가 없으면 헤더를 그릴 수 없어 기본 제목 바로 로딩·에러를 보여 준다.
  if (room === undefined) {
    const renderState = () => {
      if (isMissingRoom(error)) {
        return (
          <Typography color="textSecondary" align="center">
            채팅방을 찾을 수 없어요.
          </Typography>
        );
      }
      if (error) {
        return (
          <>
            <Typography variant="bodyMStrong" align="center" accessibilityRole="alert">
              대화를 불러오지 못했어요.
            </Typography>
            <Typography color="textSecondary" align="center">
              {error.message}
            </Typography>
            <Button variant="brand" label="다시 시도" onPress={refetch} style={styles.retry} />
          </>
        );
      }
      return <ActivityIndicator color={colors.textBrand} accessibilityLabel="대화 불러오는 중" />;
    };

    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <TopBar title="1:1 채팅" onBack={onBack} />
        <View style={[styles.center, styles.message]}>{renderState()}</View>
      </SafeAreaView>
    );
  }

  // 신고자 표시(`이름 · 학번`, `이름 · 선생님`)와 같은 규칙을 쓴다.
  const title = formatReporter({
    reporterName: room.partner.name,
    studentNumber: room.partner.studentNumber,
    reporterRole: room.partner.role,
  });

  return (
    // 아래 SafeArea 여백은 하단 탭 바가 맡는다.
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ChatRoomHeader
        name={room.partner.name}
        title={title}
        subtitle={report && `${report.alias} · ${formatWaybill(report)}`}
        onBack={onBack}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            report && (
              <ReportBanner
                label={`분실 신고 · 예상 시각 ${formatLostAt(report.lostEstimatedAt)}`}
              />
            )
          }
          ListEmptyComponent={
            isPending ? (
              <ActivityIndicator color={colors.textBrand} accessibilityLabel="대화 불러오는 중" />
            ) : error ? (
              // 방은 받았지만 메시지를 받지 못한 경우
              <View style={styles.message}>
                <Typography color="textSecondary" align="center" accessibilityRole="alert">
                  {`대화를 불러오지 못했어요. ${error.message}`}
                </Typography>
                <Button variant="soft" label="다시 시도" onPress={refetch} />
              </View>
            ) : (
              <Typography color="textTertiary" align="center" style={styles.empty}>
                아직 주고받은 메시지가 없어요
              </Typography>
            )
          }
          // 새 메시지가 붙으면 맨 아래로 내린다.
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        />
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
        <ChatInputBar onSend={handleSend} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles(({ colors, spacing }) => ({
  screen: { flex: 1, backgroundColor: colors.bgApp },
  flex: { flex: 1 },
  content: {
    gap: spacing.smPlus,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  message: { alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing['2xl'] },
  retry: { marginTop: spacing.lg },
  empty: { paddingTop: spacing['4xl'] },
  sendError: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xs },
}));
