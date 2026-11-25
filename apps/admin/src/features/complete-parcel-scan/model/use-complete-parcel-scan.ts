import { ApiError, useCompleteParcelMutation } from '@taekbae/api';
import type { ParcelCompleteRequest } from '@taekbae/types';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  type ArrivalScanResult,
  type ParcelZone,
  type ProcessedParcel,
  RECENT_LIMIT,
} from './arrival-scan';

const FALLBACK_ERROR_MESSAGE = '도착 처리에 실패했어요.';

/**
 * 바코드 스캐너 입력 → `PATCH /parcel/complete` 로 도착 처리.
 * 스캐너는 쉬지 않고 들어오므로 다른 운송장은 동시에 보내고, 요청 중인 같은 운송장만 무시한다.
 * 결과는 요청 순서와 상관없이 마지막으로 끝난 요청의 것을 보여 준다.
 */
export function useCompleteParcelScan() {
  const { mutateAsync } = useCompleteParcelMutation();
  const [zone, setZone] = useState<ParcelZone | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [result, setResult] = useState<ArrivalScanResult | null>(null);
  const [processed, setProcessed] = useState<readonly ProcessedParcel[]>([]);
  const inFlightRef = useRef(new Set<string>());
  const resultIdRef = useRef(0);
  // 요청 중에 다른 탭으로 가도 요청은 끝까지 간다 — 사라진 화면의 상태를 바꾸지 않게 한다.
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const complete = useCallback(
    async (request: ParcelCompleteRequest) => {
      const { invoiceNumber } = request;
      try {
        const parcel = await mutateAsync(request);
        if (!isMountedRef.current) return;
        const id = ++resultIdRef.current;
        setResult({ id, type: 'success', parcel });
        setProcessed((current) =>
          [{ id, parcel, processedAt: Date.now() }, ...current].slice(0, RECENT_LIMIT),
        );
      } catch (error) {
        if (!isMountedRef.current) return;
        const id = ++resultIdRef.current;
        if (error instanceof ApiError && error.status === 404) {
          setResult({ id, type: 'notFound', invoiceNumber });
        } else if (error instanceof ApiError && error.status === 409) {
          setResult({ id, type: 'alreadyDone', invoiceNumber });
        } else {
          const message =
            error instanceof Error && error.message ? error.message : FALLBACK_ERROR_MESSAGE;
          setResult({ id, type: 'error', invoiceNumber, message });
        }
      } finally {
        inFlightRef.current.delete(invoiceNumber);
        if (isMountedRef.current) setPendingCount((count) => count - 1);
      }
    },
    [mutateAsync],
  );

  /** 스캐너 입력 한 건 (Enter 시점의 값). */
  const submit = useCallback(
    (raw: string) => {
      const invoiceNumber = raw.trim();
      if (!invoiceNumber || inFlightRef.current.has(invoiceNumber)) return;

      inFlightRef.current.add(invoiceNumber);
      setPendingCount((count) => count + 1);
      void complete(zone ? { invoiceNumber, zone } : { invoiceNumber });
    },
    [complete, zone],
  );

  return {
    submit,
    /** null 이면 구역을 바꾸지 않는다 (요청에 zone 생략). */
    zone,
    setZone,
    /** 진행 중인 요청이 하나라도 있으면 true. */
    isPending: pendingCount > 0,
    /** 마지막으로 끝난 요청의 결과. 다음 결과가 올 때까지 유지된다. */
    result,
    /** 이번 화면에서 처리한 택배, 최신순 최대 RECENT_LIMIT 건. */
    processed,
  };
}
