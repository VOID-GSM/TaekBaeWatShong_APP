import { Controller } from 'react-hook-form';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { DriverQrCard } from '@/entities/driver';
import { qrXml } from '@/shared/assets/qr';
import { Button, makeStyles, TextField, Typography, useTheme } from '@/shared/ui';

import { useCreateDriverQrForm } from '../model/use-create-driver-qr-form';

/** QR 생성 탭 (시안 A11). 이름·택배사를 입력하고 발급하면 서버가 만든 QR 이미지를 보여 준다. */
export function CreateDriverQrPanel() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { form, onSubmit, qr, error, isPending } = useCreateDriverQrForm();
  const { errors } = form.formState;

  return (
    <View style={styles.container}>
      <Controller
        control={form.control}
        name="driverName"
        render={({ field }) => (
          <TextField
            label="기사님 이름"
            placeholder="예: 김택배"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            errorMessage={errors.driverName?.message}
            returnKeyType="next"
          />
        )}
      />
      {/* 시안에는 이름만 있지만 서버가 택배사를 필수로 받는다. */}
      <Controller
        control={form.control}
        name="deliveryCompany"
        render={({ field }) => (
          <TextField
            label="택배사"
            placeholder="예: CJ대한통운"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            errorMessage={errors.deliveryCompany?.message}
            returnKeyType="done"
            onSubmitEditing={() => void onSubmit()}
          />
        )}
      />

      {qr ? (
        <DriverQrCard
          driverName={qr.driverName}
          deliveryCompany={qr.deliveryCompany}
          qrImageUrl={qr.qrImageUrl}
        />
      ) : (
        <View style={styles.placeholder}>
          <SvgXml xml={qrXml} width={48} height={48} color={colors.textTertiary} />
          <Typography color="textSecondary" align="center">
            {'기사님 정보를 입력하고\nQR을 생성해 주세요'}
          </Typography>
        </View>
      )}

      {error !== null && (
        <Typography variant="caption" color="textDanger" align="center" accessibilityRole="alert">
          {error.message}
        </Typography>
      )}

      <Button
        variant="brand"
        label="기사님 QR 생성"
        loading={isPending}
        onPress={() => void onSubmit()}
      />
    </View>
  );
}

const useStyles = makeStyles(({ colors, radius, shadow, size, spacing }) => ({
  container: { alignSelf: 'stretch', gap: spacing.lg },
  // 발급 전 QR 카드 자리. 발급 후 카드와 높이를 비슷하게 맞춰 버튼이 크게 움직이지 않게 한다.
  placeholder: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    minHeight: size.qrCode + spacing['2xl'] * 2,
    padding: spacing['2xl'],
    borderRadius: radius['2xl'],
    backgroundColor: colors.bgSurface,
    ...shadow.card,
  },
}));
