import { useScanDriverQrMutation } from '@taekbae/api';
import { useCallback, useRef } from 'react';

/**
 * 카메라는 QR 이 화면에 있는 동안 초당 여러 번 인식 이벤트를 보낸다.
 * 같은 QR 은 화면에서 이만큼 사라졌다가 다시 보여야 새 방문으로 기록한다 — 비춘 채로 두면 한 번만 기록된다.
 */
export const SAME_QR_COOLDOWN_MS = 3_000;

/** 기사 QR 인식 → `POST /qr/scan` 으로 방문 기록. 요청 중에는 다른 QR 도 받지 않는다. */
export function useScanDriverQr() {
  const { mutate, data, error, isPending } = useScanDriverQrMutation();
  const lastSeenRef = useRef<{ token: string; at: number } | null>(null);
  const inFlightRef = useRef(false);

  const handleScan = useCallback(
    (raw: string) => {
      const qrToken = raw.trim();
      if (!qrToken || inFlightRef.current) return;

      const now = Date.now();
      const last = lastSeenRef.current;
      // 무시하는 동안에도 마지막으로 본 시각을 갱신해, 계속 비추고 있으면 다시 기록하지 않는다.
      lastSeenRef.current = { token: qrToken, at: now };
      if (last && last.token === qrToken && now - last.at < SAME_QR_COOLDOWN_MS) return;

      inFlightRef.current = true;
      mutate(
        { qrToken },
        {
          onSettled: () => {
            inFlightRef.current = false;
          },
        },
      );
    },
    [mutate],
  );

  return { handleScan, result: data, error, isPending };
}
