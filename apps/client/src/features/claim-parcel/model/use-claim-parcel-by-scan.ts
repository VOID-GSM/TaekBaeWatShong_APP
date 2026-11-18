import { ApiError, parcelQueries, useClaimParcelMutation } from '@taekbae/api';
import type { Parcel } from '@taekbae/types';
import { INVOICE_NUMBER_LENGTH, normalizeInvoiceNumber } from '@taekbae/utils';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export type ClaimResult =
  | { id: number; type: 'success'; message: string; alias: string }
  | { id: number; type: 'error'; message: string };

type ClaimResultInput =
  { type: 'success'; message: string; alias: string } | { type: 'error'; message: string };

/** 결과 안내를 보여 주는 시간 */
export const CLAIM_RESULT_DURATION_MS = 3000;

const INVALID_BARCODE_MESSAGE = '운송장 바코드가 아니에요. 다시 스캔해 주세요.';
const NOT_MINE_MESSAGE = '내 택배 목록에 없는 운송장이에요.';
const NOT_ARRIVED_MESSAGE = '아직 도착하지 않은 택배예요.';
const ALREADY_CLAIMED_MESSAGE = '이미 회수한 택배예요.';
const FALLBACK_SUCCESS_MESSAGE = '회수가 완료되었습니다!';

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

/**
 * 회수 흐름: 스캔 → 내 택배에서 찾아 확인 카드 표시(C8) → '회수 완료 처리'로 `PATCH /parcel/claim`.
 * 회수할 수 없는 택배(내 것이 아님·도착 전·이미 회수)는 카드 대신 안내만 띄운다.
 */
export function useClaimParcelByScan() {
  const queryClient = useQueryClient();
  const { mutateAsync, isPending: isClaiming } = useClaimParcelMutation();
  const [scanned, setScanned] = useState<Parcel | null>(null);
  const [isLookingUp, setLookingUp] = useState(false);
  const [result, setResult] = useState<ClaimResult | null>(null);
  const lookupIdRef = useRef(0);
  const resultIdRef = useRef(0);
  const claimingRef = useRef(false);
  // 요청 중에 다른 탭으로 가도 요청은 끝까지 간다 — 사라진 화면의 상태를 바꾸지 않게 한다.
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // 새 결과가 오면 타이머를 다시 잡는다 — 마지막 결과가 끝까지 보이게.
  useEffect(() => {
    if (!result) return;
    AccessibilityInfo.announceForAccessibility(result.message);
    const timer = setTimeout(() => setResult(null), CLAIM_RESULT_DURATION_MS);
    return () => clearTimeout(timer);
  }, [result]);

  const show = useCallback((next: ClaimResultInput) => {
    if (!isMountedRef.current) return;
    resultIdRef.current += 1;
    setResult({ ...next, id: resultIdRef.current });
  }, []);

  /** 스캐너가 읽은 값 한 건. 회수할 수 있는 내 택배면 확인 카드에 올린다. */
  const scan = useCallback(
    async (value: string) => {
      // 연달아 스캔하면 마지막 스캔 결과만 반영한다 — 잘못된 바코드도 앞선 조회를 무효화한다.
      const lookupId = ++lookupIdRef.current;
      const invoiceNumber = normalizeInvoiceNumber(value);
      if (
        invoiceNumber.length < INVOICE_NUMBER_LENGTH.min ||
        invoiceNumber.length > INVOICE_NUMBER_LENGTH.max
      ) {
        setLookingUp(false);
        show({ type: 'error', message: INVALID_BARCODE_MESSAGE });
        return;
      }

      setLookingUp(true);
      try {
        // 관리자가 방금 도착 처리했을 수 있어 캐시가 아니라 서버에서 새로 받는다.
        const parcels = await queryClient.fetchQuery({ ...parcelQueries.mine(), staleTime: 0 });
        if (!isMountedRef.current || lookupId !== lookupIdRef.current) return;

        const parcel = parcels.find((item) => item.invoiceNumber === invoiceNumber);
        if (!parcel) show({ type: 'error', message: NOT_MINE_MESSAGE });
        else if (parcel.status === 'CLAIMED')
          show({ type: 'error', message: ALREADY_CLAIMED_MESSAGE });
        else if (parcel.status !== 'ARRIVED') show({ type: 'error', message: NOT_ARRIVED_MESSAGE });
        else setScanned(parcel);
      } catch (error) {
        if (lookupId !== lookupIdRef.current) return;
        show({ type: 'error', message: errorMessage(error, '택배 정보를 불러오지 못했어요.') });
      } finally {
        if (isMountedRef.current && lookupId === lookupIdRef.current) setLookingUp(false);
      }
    },
    [queryClient, show],
  );

  /** 확인 카드의 택배를 회수 처리한다. */
  const confirm = useCallback(async () => {
    if (!scanned || claimingRef.current) return;
    claimingRef.current = true;
    try {
      const response = await mutateAsync({ invoiceNumber: scanned.invoiceNumber });
      if (!isMountedRef.current) return;
      // 회수하는 사이 다른 택배를 스캔했으면 그 카드는 남겨 둔다.
      setScanned((current) => (current?.id === scanned.id ? null : current));
      show({
        type: 'success',
        message: response.message || FALLBACK_SUCCESS_MESSAGE,
        alias: response.alias,
      });
    } catch (error) {
      // 404·409 는 다시 눌러도 같은 결과라(다른 기기에서 먼저 회수 등) 카드를 닫는다.
      // 네트워크 오류 등은 다시 시도할 수 있게 남긴다.
      if (
        isMountedRef.current &&
        error instanceof ApiError &&
        (error.status === 404 || error.status === 409)
      ) {
        setScanned((current) => (current?.id === scanned.id ? null : current));
      }
      // 403·404·409 는 서버의 한국어 message 가 ApiError 에 담겨 온다.
      show({ type: 'error', message: errorMessage(error, '회수 처리에 실패했어요.') });
    } finally {
      claimingRef.current = false;
    }
  }, [mutateAsync, scanned, show]);

  return {
    scan,
    /** 확인 카드에 올라간 택배 (C8). 없으면 최근 회수 목록을 보여 준다. */
    scanned,
    isLookingUp,
    confirm,
    isClaiming,
    /** 마지막 안내. 잠시 뒤 null 로 돌아간다. */
    result,
  };
}
