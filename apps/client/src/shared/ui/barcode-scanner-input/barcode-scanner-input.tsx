import { type Ref, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import { AppState, StyleSheet, TextInput, type TextInputInstance } from 'react-native';

export interface BarcodeScannerInputHandle {
  /** 스캐너 입력을 다시 받는다. 포커스를 잃었을 때 화면을 눌러 다시 연결하는 용도. */
  focus: () => void;
}

export interface BarcodeScannerInputProps {
  /** 입력을 받을 때. 화면이 보일 때만 true 로 둔다 — 탭 화면은 언마운트되지 않는다. */
  active: boolean;
  /** 스캐너가 읽은 값 한 건. 앞뒤 공백·줄바꿈은 뗀다. */
  onScan: (value: string) => void;
  /** 입력을 받을 수 있는 상태(포커스)가 바뀔 때 */
  onReadyChange?: (ready: boolean) => void;
  ref?: Ref<BarcodeScannerInputHandle>;
}

/**
 * 키보드처럼 동작하는(HID) 바코드 스캐너를 받는 보이지 않는 입력칸.
 * 스캐너는 읽은 글자를 빠르게 타이핑한 뒤 Enter(또는 Tab)를 보낸다 — 포커스를 쥔 채로 그걸 받아 `onScan` 으로 넘긴다.
 *
 * - `active` 이면 포커스를 잡고, 아니면 놓는다. active 인 동안 포커스를 잃으면 다시 잡는다.
 * - 소프트 키보드는 띄우지 않는다(`showSoftInputOnFocus={false}`).
 * - Enter 를 보내지 않게 설정된 스캐너를 위해, 입력이 잠깐 멈추면 그때까지 받은 값을 한 건으로 본다.
 */
export function BarcodeScannerInput({
  active,
  onScan,
  onReadyChange,
  ref,
}: BarcodeScannerInputProps) {
  const inputRef = useRef<TextInputInstance>(null);
  const bufferRef = useRef('');
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refocusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isActiveRef = useRef(false);
  // 렌더마다 바뀌는 콜백을 타이머 안에서 최신 값으로 부르기 위해 ref 에 둔다.
  const onScanRef = useRef(onScan);
  const onReadyChangeRef = useRef(onReadyChange);
  useEffect(() => {
    onScanRef.current = onScan;
    onReadyChangeRef.current = onReadyChange;
  });

  const clearIdleTimer = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = null;
  };

  const flush = useCallback(() => {
    clearIdleTimer();
    const value = bufferRef.current.trim();
    bufferRef.current = '';
    inputRef.current?.clear();
    if (value) onScanRef.current(value);
  }, []);

  const focus = useCallback(() => inputRef.current?.focus(), []);
  useImperativeHandle(ref, () => ({ focus }), [focus]);

  useEffect(() => {
    if (!active) return;
    const input = inputRef.current;
    isActiveRef.current = true;
    input?.focus();
    return () => {
      isActiveRef.current = false;
      if (refocusTimerRef.current) clearTimeout(refocusTimerRef.current);
      input?.blur();
    };
  }, [active]);

  // 앱이 백그라운드에 다녀오면 포커스가 풀려 있다.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && isActiveRef.current) focus();
    });
    return () => subscription.remove();
  }, [focus]);

  useEffect(
    () => () => {
      clearIdleTimer();
      if (refocusTimerRef.current) clearTimeout(refocusTimerRef.current);
    },
    [],
  );

  const handleChangeText = (text: string) => {
    // Tab·줄바꿈을 끝 신호로 보내는 스캐너도 있다.
    if (/[\r\n\t]/.test(text)) {
      bufferRef.current = text.replace(/[\r\n\t]/g, '');
      flush();
      return;
    }
    bufferRef.current = text;
    clearIdleTimer();
    idleTimerRef.current = setTimeout(flush, SCAN_IDLE_MS);
  };

  return (
    <TextInput
      ref={inputRef}
      testID="barcode-scanner-input"
      style={styles.hidden}
      showSoftInputOnFocus={false}
      caretHidden
      contextMenuHidden
      autoCorrect={false}
      autoCapitalize="none"
      autoComplete="off"
      spellCheck={false}
      importantForAutofill="no"
      // 제출 후에도 포커스를 유지해 다음 택배를 연달아 스캔한다.
      submitBehavior="submit"
      onChangeText={handleChangeText}
      onSubmitEditing={flush}
      onFocus={() => onReadyChangeRef.current?.(true)}
      onBlur={() => {
        onReadyChangeRef.current?.(false);
        if (!isActiveRef.current) return;
        refocusTimerRef.current = setTimeout(() => {
          if (isActiveRef.current) focus();
        }, REFOCUS_DELAY_MS);
      }}
      // 스크린 리더에는 보이지 않는 입력칸을 노출하지 않는다.
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      aria-hidden
    />
  );
}

/** 스캐너는 글자 사이 간격이 수 ms 다. 이 시간 동안 입력이 없으면 한 건이 끝난 것으로 본다. */
const SCAN_IDLE_MS = 300;
/** 포커스를 잃은 직후 바로 다시 잡으면 시스템 동작(알림 센터 등)과 겹쳐 깜빡일 수 있어 조금 기다린다. */
const REFOCUS_DELAY_MS = 500;

const styles = StyleSheet.create({
  // 화면에서 보이지 않지만 포커스는 받을 수 있어야 한다 (display: 'none' 은 포커스를 못 받는다).
  hidden: { position: 'absolute', width: 1, height: 1, opacity: 0, left: -10, top: -10 },
});
