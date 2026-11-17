import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { formatDateTimeInput, localDateTimeToDate, parseDateTimeInput } from '@taekbae/utils';
import { useEffect, useState } from 'react';
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '../icon';
import { TextField } from '../text-field';
import { makeStyles, useTheme } from '../theme';
import { Typography } from '../typography';

export interface DateTimeFieldProps {
  /** 칸 위에 보이는 라벨. 스크린 리더 이름으로도 쓴다. */
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  /** 선택 창이 닫힐 때(선택·취소 모두) 부른다. 폼 검증 시점을 맞추는 용도. */
  onClose?: () => void;
  minimumDate?: Date;
  maximumDate?: Date;
  /**
   * 미래 시각을 고를 수 없게 한다. 상한을 렌더 시점이 아니라 선택 창을 여는 순간의 현재 시각으로 잡는다.
   * `maximumDate` 와 함께 주면 둘 중 이른 쪽을 쓴다.
   */
  disallowFuture?: boolean;
  placeholder?: string;
  /** 있으면 테두리를 빨갛게 하고 칸 아래에 문구를 보여준다. */
  error?: string;
  style?: StyleProp<ViewStyle>;
}

/** 초점·에러일 때 테두리 두께 — `TextField` 와 같은 Figma `border-focus` 2px */
const EMPHASIS_BORDER_WIDTH = 2;

/** 시트가 올라오기 시작하는 위치(아래로 밀린 거리). 시트 높이보다 크면 된다. */
const SHEET_OFFSET = 400;

/**
 * 누르면 날짜·시각을 고르는 칸. 직접 타이핑하지 않는다.
 * iOS 는 아래에서 올라오는 휠, Android 는 시스템 날짜 → 시각 대화상자 순서로 연다.
 * 웹은 네이티브 선택기가 없어 `2026. 07. 06 15:30` 형식으로 입력받는다.
 */
export function DateTimeField(props: DateTimeFieldProps) {
  if (Platform.OS === 'web') return <WebDateTimeField {...props} />;
  return <NativeDateTimeField {...props} />;
}

function NativeDateTimeField({
  label,
  value,
  onChange,
  onClose,
  minimumDate,
  maximumDate,
  disallowFuture = false,
  placeholder = '날짜와 시각을 선택해 주세요',
  error,
  style,
}: DateTimeFieldProps) {
  const styles = useStyles();
  const { colors, motion } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  // iOS 시트에서 휠로 고르는 중인 값과, 시트를 연 순간 정한 상한
  const [draft, setDraft] = useState<Date | null>(null);
  const [sheetMax, setSheetMax] = useState<Date | undefined>(undefined);
  const [sheetTranslate] = useState(() => new Animated.Value(SHEET_OFFSET));
  const hasError = error !== undefined && error !== '';
  const isSheetOpen = draft !== null;

  // 딤은 Modal 의 fade 로 나타나고, 시트만 아래에서 밀려 올라온다.
  // 휠을 돌려 draft 가 바뀔 때마다가 아니라, 시트가 열리고 닫힐 때만 실행한다.
  useEffect(() => {
    if (!isSheetOpen) {
      sheetTranslate.setValue(SHEET_OFFSET);
      return;
    }
    Animated.timing(sheetTranslate, {
      toValue: 0,
      duration: motion.normal,
      useNativeDriver: true,
    }).start();
  }, [isSheetOpen, motion.normal, sheetTranslate]);

  const close = () => {
    setIsOpen(false);
    onClose?.();
  };

  const openAndroid = (max: Date | undefined) => {
    DateTimePickerAndroid.open({
      mode: 'date',
      value: clamp(value ?? new Date(), minimumDate, max),
      minimumDate,
      maximumDate: max,
      onChange: (dateEvent, pickedDate) => {
        if (dateEvent.type !== 'set' || pickedDate === undefined) {
          close();
          return;
        }
        DateTimePickerAndroid.open({
          mode: 'time',
          value: pickedDate,
          is24Hour: false,
          onChange: (timeEvent, pickedTime) => {
            // Android 시각 대화상자는 min/max 를 지원하지 않아 고른 값을 범위 안으로 맞춘다.
            if (timeEvent.type === 'set' && pickedTime !== undefined) {
              onChange(clamp(pickedTime, minimumDate, max));
            }
            close();
          },
        });
      },
    });
  };

  const open = () => {
    const max = resolveMaximumDate(maximumDate, disallowFuture);
    setIsOpen(true);
    if (Platform.OS === 'android') {
      openAndroid(max);
    } else {
      setSheetMax(max);
      setDraft(clamp(value ?? new Date(), minimumDate, max));
    }
  };

  const closeSheet = (confirm: boolean) => {
    if (confirm && draft !== null) onChange(clamp(draft, minimumDate, sheetMax));
    setDraft(null);
    close();
  };

  return (
    <View style={[styles.container, style]}>
      {/* 라벨은 버튼의 accessibilityLabel 로 읽히므로, 화면 글자는 스크린 리더에서 뺀다. */}
      <Typography
        variant="bodyMStrong"
        color="textSecondary"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {label}
      </Typography>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ? formatDateTimeLabel(value) : '선택 안 함'}`}
        accessibilityHint={hasError ? error : '눌러서 날짜와 시각을 선택합니다'}
        accessibilityState={{ expanded: isOpen }}
        onPress={open}
        style={({ pressed }) => [
          styles.trigger,
          isOpen && styles.focused,
          hasError && styles.invalid,
          (isOpen || hasError) && styles.emphasis,
          pressed && styles.pressed,
        ]}
      >
        <Typography variant="bodyMStrong" color={value ? 'textPrimary' : 'textTertiary'}>
          {value ? formatDateTimeLabel(value) : placeholder}
        </Typography>
        <Icon name="chevronDown" />
      </Pressable>
      {hasError && (
        <Typography variant="caption" color="textDanger" accessibilityLiveRegion="polite">
          {error}
        </Typography>
      )}

      {Platform.OS === 'ios' && (
        <Modal
          visible={isSheetOpen}
          transparent
          animationType="fade"
          onRequestClose={() => closeSheet(false)}
        >
          <Pressable
            style={styles.scrim}
            onPress={() => closeSheet(false)}
            accessibilityRole="button"
            accessibilityLabel="선택 닫기"
          />
          <Animated.View style={{ transform: [{ translateY: sheetTranslate }] }}>
            <SafeAreaView edges={['bottom']} style={styles.sheet}>
              <View style={styles.sheetHeader}>
                <Pressable accessibilityRole="button" hitSlop={8} onPress={() => closeSheet(false)}>
                  <Typography variant="bodyMStrong" color="textSecondary">
                    취소
                  </Typography>
                </Pressable>
                <Typography variant="bodyMStrong">{label}</Typography>
                <Pressable accessibilityRole="button" hitSlop={8} onPress={() => closeSheet(true)}>
                  <Typography variant="bodyMStrong" color="textBrand">
                    완료
                  </Typography>
                </Pressable>
              </View>
              {draft !== null && (
                <DateTimePicker
                  value={draft}
                  mode="datetime"
                  display="spinner"
                  locale="ko-KR"
                  minimumDate={minimumDate}
                  maximumDate={sheetMax}
                  textColor={colors.textPrimary}
                  onChange={(_, picked) => {
                    if (picked !== undefined) setDraft(picked);
                  }}
                />
              )}
            </SafeAreaView>
          </Animated.View>
        </Modal>
      )}
    </View>
  );
}

/** 웹 대체 입력. 형식이 맞는 값만 `onChange` 로 넘기고, 틀리면 칸 아래에 형식을 안내한다. */
function WebDateTimeField({
  label,
  value,
  onChange,
  onClose,
  minimumDate,
  maximumDate,
  disallowFuture = false,
  error,
  style,
}: DateTimeFieldProps) {
  const [text, setText] = useState(() => (value ? formatDateTimeInput(value) : ''));
  const [formatError, setFormatError] = useState<string | null>(null);

  const toDate = (input: string) => {
    const localDateTime = parseDateTimeInput(input);
    return localDateTime === null ? null : localDateTimeToDate(localDateTime);
  };

  return (
    <TextField
      label={label}
      value={text}
      onChangeText={(next) => {
        setText(next);
        const date = toDate(next);
        if (date !== null) {
          setFormatError(null);
          onChange(clamp(date, minimumDate, resolveMaximumDate(maximumDate, disallowFuture)));
        }
      }}
      onBlur={() => {
        setFormatError(
          toDate(text) === null ? '날짜와 시각을 2026. 07. 06 15:30 형식으로 입력해 주세요.' : null,
        );
        onClose?.();
      }}
      error={formatError ?? error}
      placeholder="2026. 07. 06 15:30"
      autoCorrect={false}
      style={style}
    />
  );
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

/** `2026년 7월 6일 (월) 오후 3:30` */
export function formatDateTimeLabel(date: Date): string {
  const hours = date.getHours();
  const meridiem = hours < 12 ? '오전' : '오후';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return (
    `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ` +
    `(${WEEKDAYS[date.getDay()]}) ${meridiem} ${hour12}:${minutes}`
  );
}

/** 선택 창을 여는 순간의 상한. `disallowFuture` 면 지금과 `maximumDate` 중 이른 쪽. */
function resolveMaximumDate(maximumDate: Date | undefined, disallowFuture: boolean) {
  if (!disallowFuture) return maximumDate;
  const now = new Date();
  return maximumDate !== undefined && maximumDate < now ? maximumDate : now;
}

function clamp(date: Date, min?: Date, max?: Date): Date {
  if (min && date < min) return min;
  if (max && date > max) return max;
  return date;
}

const useStyles = makeStyles(({ borderWidth, colors, opacity, radius, size, spacing }) => ({
  container: { gap: spacing.sm },
  trigger: {
    height: size.inputM,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: borderWidth.thin,
    borderColor: colors.borderDefault,
    backgroundColor: colors.bgSurface,
  },
  pressed: { opacity: opacity.pressed },
  // 포커스·에러 테두리는 TextField 와 같은 토큰·두께를 쓴다.
  focused: { borderColor: colors.borderFocus },
  invalid: { borderColor: colors.textDanger },
  // 테두리가 두꺼워진 만큼 안쪽 여백을 줄여 글자가 움직이지 않게 한다.
  emphasis: {
    borderWidth: EMPHASIS_BORDER_WIDTH,
    paddingHorizontal: spacing.lg - (EMPHASIS_BORDER_WIDTH - borderWidth.thin),
  },
  scrim: { flex: 1, backgroundColor: colors.bgScrim },
  sheet: {
    backgroundColor: colors.bgSurface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    alignItems: 'center',
  },
  sheetHeader: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: borderWidth.thin,
    borderBottomColor: colors.borderDefault,
  },
}));
