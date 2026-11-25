import { ApiError, chatQueries, useCreateChatRoomMutation } from '@taekbae/api';
import type { ChatPartner } from '@taekbae/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import type { LostReport } from '@/entities/lost-report';

export const REPORTER_NOT_FOUND_MESSAGE = '신고자를 채팅 상대에서 찾지 못했어요.';

/** 채팅 상대 검색 한 번에 받는 수. 동명이인 판별에 충분한 만큼만 받는다. */
const PARTNER_SEARCH_SIZE = 20;

/**
 * 채팅 상대 검색 결과에서 신고자를 고른다. 학번이 같은 상대를 우선하고,
 * 없으면 이름이 정확히 같은 상대가 한 명일 때만 고른다(동명이인이면 고르지 않는다).
 */
export function findReporterPartner(
  partners: readonly ChatPartner[],
  report: Pick<LostReport, 'reporterName' | 'studentNumber'>,
  /** 검색 결과가 더 있으면(`hasNext`) 이름만으로는 한 명인지 알 수 없어 고르지 않는다. */
  hasMore = false,
): ChatPartner | null {
  const candidates = partners.filter((partner) => partner.role !== 'ADMIN');
  if (report.studentNumber) {
    const byNumber = candidates.find((partner) => partner.studentNumber === report.studentNumber);
    if (byNumber) return byNumber;
  }
  if (hasMore) return null;
  // 신고에 학번이 있으면 학번이 다른 동명이인은 신고자가 아니다.
  const byName = candidates.filter(
    (partner) =>
      partner.name === report.reporterName && (!report.studentNumber || !partner.studentNumber),
  );
  return byName.length === 1 ? (byName[0] ?? null) : null;
}

export interface UseStartReportChatResult {
  /** 신고자와의 채팅방을 열거나 만들고 roomId 를 돌려준다. 실패하면 `ApiError` 를 던진다. */
  start: (report: LostReport) => Promise<number>;
  isPending: boolean;
  error: ApiError | null;
}

/**
 * 분실 신고에서 신고자와의 1:1 채팅을 시작한다.
 * 1. 신고에 `chatRoomId` 가 있으면 그 방
 * 2. `reporterId` 가 있으면 그 사용자와 방 생성(이미 있으면 서버가 기존 방을 준다)
 * 3. 둘 다 없으면(서버 미제공, SERVER#26) 채팅 상대 검색으로 신고자를 찾아 방 생성
 */
export function useStartReportChat(): UseStartReportChatResult {
  const queryClient = useQueryClient();
  const { mutateAsync: createRoom } = useCreateChatRoomMutation();

  const findReporterId = useCallback(
    async (report: LostReport): Promise<number> => {
      if (report.reporterId != null) return report.reporterId;

      const keywords = [report.studentNumber, report.reporterName].filter(
        (keyword): keyword is string => Boolean(keyword),
      );
      for (const keyword of keywords) {
        const { partners, hasNext } = await queryClient.fetchQuery(
          chatQueries.partners({ keyword, size: PARTNER_SEARCH_SIZE }),
        );
        const partner = findReporterPartner(partners, report, hasNext);
        if (partner) return partner.id;
      }
      throw new ApiError(REPORTER_NOT_FOUND_MESSAGE);
    },
    [queryClient],
  );

  const mutation = useMutation<number, ApiError, LostReport>({
    mutationFn: async (report) => {
      if (report.chatRoomId != null) return report.chatRoomId;
      const room = await createRoom(await findReporterId(report));
      return room.id;
    },
  });

  return { start: mutation.mutateAsync, isPending: mutation.isPending, error: mutation.error };
}
