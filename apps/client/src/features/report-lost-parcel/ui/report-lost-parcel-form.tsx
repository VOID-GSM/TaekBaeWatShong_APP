import { type Control, Controller } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { DateTimeField, spacing, TextField } from '@/shared/ui';

import {
  REPORT_CONTENT_MAX_LENGTH,
  type ReportLostParcelFormValues,
} from '../model/report-lost-parcel-form-schema';

export interface ReportLostParcelFormProps {
  control: Control<ReportLostParcelFormValues>;
}

/** 분실 예상 시각·상세 내용 입력 (시안 C9). 제출 버튼은 화면 하단에 고정돼 페이지가 그린다. */
export function ReportLostParcelForm({ control }: ReportLostParcelFormProps) {
  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name="lostEstimatedAt"
        render={({ field, fieldState }) => (
          <DateTimeField
            label="분실 예상 시각"
            value={field.value}
            onChange={field.onChange}
            onClose={field.onBlur}
            // 미래 시각은 고를 수 없게 한다. 상한은 선택 창을 여는 순간의 현재 시각이다.
            disallowFuture
            error={fieldState.error?.message}
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
