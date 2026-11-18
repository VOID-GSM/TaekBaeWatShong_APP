import { Badge, type BadgeTone } from '@/shared/ui';

import type { ParcelStatus } from '../model/parcel';

const statusBadge: Record<ParcelStatus, { label: string; tone: BadgeTone }> = {
  inTransit: { label: '배송중', tone: 'brand' },
  arrived: { label: '도착', tone: 'success' },
  overdue: { label: '방치 경고', tone: 'danger' },
  claimed: { label: '수령 완료', tone: 'neutral' },
};

export function ParcelStatusBadge({ status }: { status: ParcelStatus }) {
  return <Badge {...statusBadge[status]} />;
}
