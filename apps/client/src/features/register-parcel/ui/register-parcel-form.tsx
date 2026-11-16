import { Controller } from 'react-hook-form';
import { View } from 'react-native';

import { formatInvoiceNumber, PARCEL_CARRIERS } from '@/entities/parcel';
import { Button, Chip, makeStyles, TextField, Typography } from '@/shared/ui';

import { ALIAS_MAX_LENGTH, type RegisterParcelValues } from '../model/register-parcel-schema';
import { useRegisterParcelForm } from '../model/use-register-parcel-form';

export interface RegisterParcelFormProps {
  onSubmit?: (values: RegisterParcelValues) => void | Promise<void>;
}

/** 운송장 번호 · 택배사 · 상품명 입력 카드와 등록 버튼. 버튼은 화면 맨 아래에 붙는다. */
export function RegisterParcelForm({ onSubmit }: RegisterParcelFormProps) {
  const styles = useStyles();
  const { form, onSubmit: handleSubmit, isSubmitting } = useRegisterParcelForm(onSubmit);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Controller
          control={form.control}
          name="invoiceNumber"
          render={({ field, fieldState }) => (
            <TextField
              label="운송장 번호 *"
              value={field.value}
              onChangeText={(text) => field.onChange(formatInvoiceNumber(text))}
              onBlur={field.onBlur}
              errorMessage={fieldState.error?.message}
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
              <Typography variant="bodyMStrong" color="textSecondary">
                택배사 *
              </Typography>
              <View style={styles.chips} accessibilityRole="radiogroup">
                {PARCEL_CARRIERS.map((carrier) => (
                  <Chip
                    key={carrier}
                    label={carrier}
                    selected={field.value === carrier}
                    onPress={() => field.onChange(carrier)}
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
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              errorMessage={fieldState.error?.message}
              placeholder="예) 겨울 패딩"
              maxLength={ALIAS_MAX_LENGTH}
              returnKeyType="done"
              onSubmitEditing={() => void handleSubmit()}
            />
          )}
        />
      </View>

      <View style={styles.spacer} />

      <Button
        variant="brand"
        label="택배 등록하기"
        labelVariant="bodyMStrong"
        loading={isSubmitting}
        onPress={() => void handleSubmit()}
      />
    </View>
  );
}

const useStyles = makeStyles(({ colors, radius, shadow, spacing }) => ({
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
}));
