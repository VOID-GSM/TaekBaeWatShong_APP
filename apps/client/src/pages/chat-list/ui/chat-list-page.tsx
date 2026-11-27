import { ActivityIndicator, FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChatListItem, STAFF_NAME } from '@/entities/chat';
import { Button, makeStyles, TopBar, Typography, useTheme } from '@/shared/ui';

import { useChatList } from '../model/use-chat-list';

export interface ChatListPageProps {
  onOpenRoom: (roomId: number) => void;
}

/** 학생·선생님 채팅 목록. 방을 누르면 채팅방으로 들어간다. */
export function ChatListPage({ onOpenRoom }: ChatListPageProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { rooms, hasStaffRoom, isPending, error, refetch, startStaffChat, isStarting, startError } =
    useChatList();

  const handleStartStaffChat = async () => {
    // 실패 문구는 startError 로 보여 준다.
    const roomId = await startStaffChat().catch(() => null);
    if (roomId !== null) onOpenRoom(roomId);
  };

  const renderBody = () => {
    // 백그라운드 재조회가 실패해도 기존 목록이 있으면 목록을 우선 보여 준다.
    if (rooms.length === 0 && isPending) {
      return (
        <View style={styles.center}>
          <ActivityIndicator color={colors.textBrand} accessibilityLabel="채팅 목록 불러오는 중" />
        </View>
      );
    }

    if (rooms.length === 0 && error) {
      return (
        <View style={[styles.center, styles.message]}>
          <Typography variant="bodyMStrong" align="center" accessibilityRole="alert">
            채팅 목록을 불러오지 못했어요.
          </Typography>
          <Typography color="textSecondary" align="center">
            {error.message}
          </Typography>
          <Button
            label="다시 시도"
            variant="outline"
            size="m"
            onPress={() => void refetch()}
            style={styles.retry}
          />
        </View>
      );
    }

    return (
      <FlatList
        data={rooms}
        keyExtractor={(room) => String(room.id)}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => <ChatListItem room={item} onPress={() => onOpenRoom(item.id)} />}
        // 학생생활안전부와의 방이 아직 없으면 맨 위에서 대화를 시작할 수 있게 한다.
        ListHeaderComponent={
          hasStaffRoom ? undefined : (
            <View style={styles.start}>
              <Typography color="textSecondary">
                {`택배 분실·방치 등 궁금한 점은 ${STAFF_NAME}에 물어보세요.`}
              </Typography>
              {startError !== null && (
                <Typography variant="caption" color="textDanger" accessibilityRole="alert">
                  {startError.message}
                </Typography>
              )}
              <Button
                label={`${STAFF_NAME}에 문의하기`}
                loading={isStarting}
                onPress={() => void handleStartStaffChat()}
              />
            </View>
          )
        }
        ListEmptyComponent={
          hasStaffRoom ? undefined : (
            <Typography color="textTertiary" align="center" style={styles.empty}>
              아직 채팅이 없어요
            </Typography>
          )
        }
      />
    );
  };

  return (
    // 아래 SafeArea 여백은 하단 탭 바가 맡는다.
    <SafeAreaView style={styles.screen} edges={['top']}>
      <TopBar title="채팅" />
      {renderBody()}
    </SafeAreaView>
  );
}

const useStyles = makeStyles(({ colors, radius, shadow, spacing }) => ({
  screen: { flex: 1, backgroundColor: colors.bgApp },
  content: {
    flexGrow: 1,
    gap: spacing.smPlus,
    paddingTop: spacing.xs,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  start: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.bgSurface,
    ...shadow.card,
  },
  empty: { paddingTop: spacing['2xl'] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  message: { gap: spacing.sm, paddingHorizontal: spacing['2xl'] },
  retry: { marginTop: spacing.lg },
}));
