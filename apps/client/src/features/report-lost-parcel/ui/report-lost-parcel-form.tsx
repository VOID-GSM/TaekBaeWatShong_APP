import { type Control, Controller } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { spacing, TextField } from '@/shared/ui';

import {
  REPORT_CONTENT_MAX_LENGTH,
  type ReportLostParcelFormValues,
} from '../model/report-lost-parcel-form-schema';

export interface ReportLostParcelFormProps {
  control: Control<ReportLostParcelFormValues>;
}

/** "YYYY. MM. DD HH:mm" 길이 */
const DATE_TIME_INPUT_LENGTH = 18;

/** 분실 예상 시각·상세 내용 입력 (시안 C9). 제출 버튼은 화면 하단에 고정돼 페이지가 그린다. */
export function ReportLostParcelForm({ control }: ReportLostParcelFormProps) {
  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name="lostEstimatedAt"
        render={({ field, fieldState }) => (
          <TextField
            label="분실 예상 시각"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            placeholder="2026. 07. 06 15:30"
            keyboardType="numbers-and-punctuation"
            maxLength={DATE_TIME_INPUT_LENGTH}
            autoCorrect={false}
            returnKeyType="next"
          />
        )}
      />
      <Controller
        control={control}
        name="content"
        render={({ field, fieldState }) => (
          <TextField
            label="상세 내용"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            placeholder="언제, 어디서 택배를 마지막으로 봤는지 적어 주세요."
            multiline
            maxLength={REPORT_CONTENT_MAX_LENGTH}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
});
