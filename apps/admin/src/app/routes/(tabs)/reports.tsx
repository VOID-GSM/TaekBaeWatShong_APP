import { useRouter } from 'expo-router';
import { useState } from 'react';

import type { LostReport } from '@/entities/lost-report';
import { useStartReportChat } from '@/features/start-report-chat';
import { LostReportsPage } from '@/pages/lost-reports';

export default function ReportsRoute() {
  const router = useRouter();
  const { start, error } = useStartReportChat();
  const [openingReportId, setOpeningReportId] = useState<number | null>(null);

  const openChat = async (report: LostReport) => {
    if (openingReportId !== null) return;
    setOpeningReportId(report.id);
    try {
      const roomId = await start(report);
      router.push({
        pathname: '/chats/[roomId]',
        params: { roomId: String(roomId), reportId: String(report.id) },
      });
    } catch {
      // 실패 문구는 useStartReportChat 의 error 로 목록 위에 보여 준다.
    } finally {
      setOpeningReportId(null);
    }
  };

  return (
    <LostReportsPage
      onOpenChat={(report) => void openChat(report)}
      openingChatReportId={openingReportId}
      chatError={error?.message ?? null}
    />
  );
}
