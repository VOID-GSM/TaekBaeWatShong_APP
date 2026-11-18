import { useLocalSearchParams } from 'expo-router';

import { ReportLostParcelPage } from '@/pages/report-lost-parcel';

/** `/report/<운송장 번호>` — 경로 파라미터만 꺼내 페이지에 넘긴다. */
export default function ReportLostParcelRoute() {
  const { invoiceNumber } = useLocalSearchParams<{ invoiceNumber: string }>();

  return <ReportLostParcelPage invoiceNumber={invoiceNumber ?? ''} />;
}
