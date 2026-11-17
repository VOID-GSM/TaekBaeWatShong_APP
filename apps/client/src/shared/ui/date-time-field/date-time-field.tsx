import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Modal, Platform, Pressable, type StyleProp, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '../icon';
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
  placeholder?: string;
  /** 있으면 테두리를 빨갛게 하고 칸 아래에 문구를 보여준다. */
  error?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * 누르면 날짜·시각을 고르는 칸. 직접 타이핑하지 않는다.
 * iOS 는 아래에서 올라오는 휠, Android 는 시스템 날짜 → 시각 대화상자 순서로 연다.
 */
export function DateTimeField({
  label,
  value,
  onChange,
  onClose,
  minimumDate,
  maximumDate,
  placeholder = '날짜와 시각을 선택해 주세요',
  error,
  style,
}: DateTimeFieldProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [draft, setDraft] = useState<Date | null>(null);
  const hasError = error !== undefined && error !== '';

  const initial = () => clamp(value ?? new Date(), minimumDate, maximumDate);

  const openAndroid = () => {
    DateTimePickerAndroid.open({
      mode: 'date',
      value: initial(),
      minimumDate,
      maximumDate,
      onChange: (dateEvent, pickedDate) => {
        if (dateEvent.type !== 'set' || pickedDate === undefined) {
          onClose?.();
          return;
        }
        DateTimePickerAndroid.open({
          mode: 'time',
          value: pickedDate,
          is24Hour: false,
          onChange: (timeEvent, pickedTime) => {
            if (timeEvent.type === 'set' && pickedTime !== undefined) onChange(pickedTime);
            onClose?.();
          },
        });
      },
    });
  };

  const open = () => {
    if (Platform.OS === 'android') {
      openAndroid();
    } else {
      setDraft(initial());
    }
  };

  const closeSheet = (confirm: boolean) => {
    if (confirm && draft !== null) onChange(draft);
    setDraft(null);
    onClose?.();
  };

  return (
    <View style={[styles.container, style]}>
      <Typography variant="bodyMStrong" color="textSecondary">
        {label}
      </Typography>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ? formatDateTimeLabel(value) : '선택 안 함'}`}
        accessibilityHint={hasError ? error : '눌러서 날짜와 시각을 선택합니다'}
        onPress={open}
        style={({ pressed }) => [
          styles.trigger,
          draft !== null && styles.focused,
          hasError && styles.invalid,
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

      {Platform.OS !== 'android' && (
        <Modal
          visible={draft !== null}
          transparent
          animationType="slide"
          onRequestClose={() => closeSheet(false)}
        >
          <Pressable
            style={styles.scrim}
            onPress={() => closeSheet(false)}
            accessibilityRole="button"
            accessibilityLabel="선택 닫기"
          />
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
                maximumDate={maximumDate}
                textColor={colors.textPrimary}
                onChange={(_, picked) => {
                  if (picked !== undefined) setDraft(picked);
                }}
              />
            )}
          </SafeAreaView>
        </Modal>
      )}
    </View>
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
  // 포커스·에러 테두리는 TextField 와 맞춘다.
  focused: { borderColor: colors.textBrand },
  invalid: { borderColor: colors.textDanger },
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
