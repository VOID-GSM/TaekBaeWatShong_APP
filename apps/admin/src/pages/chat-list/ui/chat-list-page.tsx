import { useMemo } from 'react';
import { ActivityIndicator, SectionList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChatListItem, type ChatRoomSummary } from '@/entities/chat';
import { Badge, Button, makeStyles, TopBar, Typography, useTheme } from '@/shared/ui';

import { useChatList } from '../model/use-chat-list';

export interface ChatListPageProps {
  onOpenRoom: (roomId: number) => void;
}

interface ChatSection {
  key: 'requested' | 'active';
  title: string;
  data: ChatRoomSummary[];
}

/** 관리자 1:1 채팅 목록 (시안 A8). */
export function ChatListPage({ onOpenRoom }: ChatListPageProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { requested, active, isPending, error, refetch } = useChatList();

  // 빈 섹션은 머리글까지 숨긴다.
  const sections = useMemo<ChatSection[]>(
    () =>
      [
        { key: 'requested' as const, title: '채팅 요청', data: requested },
        { key: 'active' as const, title: '진행 중', data: active },
      ].filter((section) => section.data.length > 0),
    [requested, active],
  );
  const isEmpty = sections.length === 0;

  const renderBody = () => {
    // 백그라운드 재조회가 실패해도 기존 목록이 있으면 목록을 우선 보여 준다.
    if (isEmpty && isPending) {
      return (
        <View style={styles.center}>
          <ActivityIndicator color={colors.textBrand} accessibilityLabel="채팅 목록 불러오는 중" />
        </View>
      );
    }

    if (isEmpty && error) {
      return (
        <View style={[styles.center, styles.message]}>
          <Typography variant="bodyMStrong" align="center" accessibilityRole="alert">
            채팅 목록을 불러오지 못했어요.
          </Typography>
          <Typography color="textSecondary" align="center">
            {error.message}
          </Typography>
          <Button
            variant="brand"
            label="다시 시도"
            onPress={() => void refetch()}
            style={styles.retry}
          />
        </View>
      );
    }

    return (
      <SectionList
        sections={sections}
        keyExtractor={(room) => String(room.id)}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.content}
        renderSectionHeader={({ section }) => (
          <View style={[styles.sectionHeader, section.key === 'active' && styles.sectionGap]}>
            <Typography variant="headingH2" accessibilityRole="header" style={styles.flex}>
              {section.title}
            </Typography>
            {section.key === 'requested' && (
              <Badge
                tone="danger"
                label={String(section.data.length)}
                accessibilityLabel={`채팅 요청 ${section.data.length}건`}
              />
            )}
          </View>
        )}
        renderItem={({ item }) => <ChatListItem room={item} onPress={() => onOpenRoom(item.id)} />}
        ListEmptyComponent={
          <View style={styles.center}>
            <Typography color="textSecondary" align="center">
              아직 채팅이 없어요
            </Typography>
          </View>
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <TopBar variant="title" title="1:1 채팅" />
      {renderBody()}
    </SafeAreaView>
  );
}

const useStyles = makeStyles(({ colors, spacing }) => ({
  screen: { flex: 1, backgroundColor: colors.bgApp },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    gap: spacing.smPlus,
    paddingTop: spacing.xs,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionGap: { paddingTop: spacing.sm },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  message: { gap: spacing.sm, paddingHorizontal: spacing['2xl'] },
  retry: { marginTop: spacing.lg },
}));
