import { formatInvoiceNumberInput } from '@taekbae/utils';
import { Controller } from 'react-hook-form';
import { View } from 'react-native';

import { PARCEL_CARRIERS } from '@/entities/parcel';
import { Button, Chip, makeStyles, TextField, Typography } from '@/shared/ui';

import { ALIAS_MAX_LENGTH } from '../model/register-parcel-schema';
import {
  useRegisterParcelForm,
  type UseRegisterParcelFormOptions,
} from '../model/use-register-parcel-form';

export type RegisterParcelFormProps = UseRegisterParcelFormOptions;

/** 운송장 번호 · 택배사 · 상품명 입력 카드와 등록 버튼. 버튼은 화면 맨 아래에 붙는다. */
export function RegisterParcelForm({ onSuccess }: RegisterParcelFormProps) {
  const styles = useStyles();
  const { form, submit, isSubmitting, submitError, registered, clearFeedback } =
    useRegisterParcelForm({
      onSuccess,
    });

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Controller
          control={form.control}
          name="invoiceNumber"
          render={({ field, fieldState }) => (
            <TextField
              label="운송장 번호"
              required
              value={field.value}
              onChangeText={(text) => {
                clearFeedback();
                field.onChange(formatInvoiceNumberInput(text));
              }}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              size="l"
              placeholder="숫자만 입력해 주세요"
              keyboardType="number-pad"
              autoComplete="off"
              returnKeyType="done"
            />
          )}
        />

        <Controller
          control={form.control}
          name="deliveryCompany"
          render={({ field, fieldState }) => (
            <View style={styles.field}>
              <Typography
                variant="bodyMStrong"
                color="textSecondary"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                택배사 *
              </Typography>
              <View
                style={styles.chips}
                accessibilityRole="radiogroup"
                accessibilityLabel="택배사, 필수"
              >
                {PARCEL_CARRIERS.map((carrier) => (
                  <Chip
                    key={carrier}
                    label={carrier}
                    selected={field.value === carrier}
                    onPress={() => {
                      clearFeedback();
                      field.onChange(carrier);
                    }}
                  />
                ))}
              </View>
              {fieldState.error?.message !== undefined && (
                <Typography variant="bodyMStrong" color="textDanger" accessibilityRole="alert">
                  {fieldState.error.message}
                </Typography>
              )}
            </View>
          )}
        />

        <Controller
          control={form.control}
          name="alias"
          render={({ field, fieldState }) => (
            <TextField
              label="상품명 (선택)"
              helperText="내가 알아보기 쉬운 이름으로 저장돼요"
              value={field.value}
              onChangeText={(text) => {
                clearFeedback();
                field.onChange(text);
              }}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              size="l"
              placeholder="예) 겨울 패딩"
              maxLength={ALIAS_MAX_LENGTH}
              returnKeyType="done"
              onSubmitEditing={submit}
            />
          )}
        />
      </View>

      <View style={styles.spacer} />

      {submitError !== null && (
        <Typography
          variant="bodyMStrong"
          color="textDanger"
          align="center"
          accessibilityRole="alert"
        >
          {submitError}
        </Typography>
      )}
      {/* 시안에 등록 완료 화면이 없어 버튼 위 문구로 알린다 — 디자이너 확인 필요. */}
      {registered !== null && (
        <Typography
          variant="bodyMStrong"
          color="textBrand"
          align="center"
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
        >
          {`'${registered.alias}' 택배를 등록했어요`}
        </Typography>
      )}

      <Button
        variant="brand"
        label="택배 등록하기"
        labelVariant="bodyMStrong"
        loading={isSubmitting}
        style={styles.submit}
        onPress={submit}
      />
    </View>
  );
}

const useStyles = makeStyles(({ colors, radius, shadow, size, spacing }) => ({
  container: { flexGrow: 1, gap: spacing.lg },
  card: {
    gap: spacing.xl,
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.bgSurface,
    ...shadow.card,
  },
  field: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  spacer: { flexGrow: 1 },
  // Figma 시안상 입력칸과 같은 높이(52)
  submit: { height: size.field },
}));
