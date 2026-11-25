import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, TextInput, type TextInputInstance, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { scanBarcodeXml } from '@/shared/assets/scan-barcode';
import { makeStyles, Typography, useTheme } from '@/shared/ui';

export interface ScanInputProps {
  /** 화면이 보이는 동안 true — 포커스를 잡고, 빠지면 다시 잡는다. false 면 잡지 않는다. */
  active: boolean;
  onSubmit: (value: string) => void;
}

/** 스크린 리더를 쓰는 중인지. 켜져 있으면 포커스를 억지로 되찾지 않는다 (읽는 위치를 빼앗지 않게). */
function useScreenReaderEnabled() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isScreenReaderEnabled().then((value) => {
      if (alive) setEnabled(value);
    });
    const subscription = AccessibilityInfo.addEventListener('screenReaderChanged', setEnabled);
    return () => {
      alive = false;
      subscription.remove();
    };
  }, []);
  return enabled;
}

/**
 * 바코드 스캐너 입력칸. 스캐너는 키보드처럼 `값 + Enter` 를 보내므로 Enter 마다 값을 넘기고 바로 비운다.
 * 화면이 보이는 동안에는 포커스를 놓쳐도(다른 버튼을 눌러도) 다시 잡아 다음 스캔을 놓치지 않는다.
 */
export function ScanInput({ active, onSubmit }: ScanInputProps) {
  const styles = useStyles();
  const { colors, size } = useTheme();
  const inputRef = useRef<TextInputInstance>(null);
  const [value, setValue] = useState('');
  const screenReaderEnabled = useScreenReaderEnabled();
  const keepFocus = active && !screenReaderEnabled;

  // 타이머·AppState 콜백 안에서 최신 값을 보려고 ref 에 둔다.
  const keepFocusRef = useRef(keepFocus);
  const refocusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearRefocusTimer = () => {
    if (refocusTimerRef.current !== null) clearTimeout(refocusTimerRef.current);
    refocusTimerRef.current = null;
  };

  // 탭 화면은 다른 탭으로 가도 언마운트되지 않는다 — 안 보일 때 포커스를 쥐고 있으면 다른 화면 입력을 가로챈다.
  useEffect(() => {
    if (!active) return;
    const input = inputRef.current;
    input?.focus();
    return () => {
      // 아래 blur 로 들어오는 onBlur 가 포커스를 되찾지 않게 먼저 끈다.
      keepFocusRef.current = false;
      clearRefocusTimer();
      input?.blur();
    };
  }, [active]);

  useEffect(() => {
    keepFocusRef.current = keepFocus;
  }, [keepFocus]);

  // 앱이 백그라운드에 다녀오면 포커스가 풀려 있다.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && keepFocusRef.current) inputRef.current?.focus();
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => clearRefocusTimer, []);

  const handleBlur = () => {
    if (!keepFocusRef.current) return;
    // 누른 버튼의 onPress 가 먼저 끝나도록 한 틱 미룬다. blur 가 연달아 나도 타이머가 쌓이지 않게 한다.
    clearRefocusTimer();
    refocusTimerRef.current = setTimeout(() => {
      refocusTimerRef.current = null;
      if (keepFocusRef.current) inputRef.current?.focus();
    }, 0);
  };

  const handleSubmit = () => {
    onSubmit(value);
    // 연속 스캔을 막지 않도록 요청을 기다리지 않고 비운다. 요청 중인 같은 값은 model 이 무시한다.
    setValue('');
  };

  return (
    <View style={styles.container}>
      <Typography variant="bodyMStrong" color="textSecondary">
        바코드 입력
      </Typography>
      <View style={styles.field}>
        <SvgXml
          xml={scanBarcodeXml}
          width={size.iconL}
          height={size.iconL}
          color={colors.textBrand}
        />
        <TextInput
          ref={inputRef}
          testID="scan-input"
          accessibilityLabel="운송장 바코드 입력"
          accessibilityHint="바코드를 스캔하거나 운송장 번호를 입력한 뒤 Enter 를 누르면 도착 처리돼요."
          value={value}
          onChangeText={setValue}
          onSubmitEditing={handleSubmit}
          onBlur={handleBlur}
          autoFocus={active}
          submitBehavior="submit"
          returnKeyType="done"
          autoCorrect={false}
          autoCapitalize="none"
          autoComplete="off"
          spellCheck={false}
          placeholder="바코드를 스캔해 주세요"
          placeholderTextColor={colors.textTertiary}
          style={styles.input}
        />
      </View>
    </View>
  );
}

const useStyles = makeStyles(({ colors, radius, size, spacing, typography }) => ({
  container: { alignSelf: 'stretch', gap: spacing.sm },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    height: size.scanInput,
    paddingHorizontal: spacing.lg,
    borderWidth: 2,
    borderColor: colors.textBrand,
    borderRadius: radius.md,
    backgroundColor: colors.bgSurface,
  },
  input: {
    flex: 1,
    alignSelf: 'stretch',
    paddingVertical: 0,
    color: colors.textPrimary,
    fontFamily: typography.displayM.fontFamily,
    fontSize: typography.displayM.fontSize,
  },
}));
