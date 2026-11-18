import { ActivityIndicator, KeyboardAvoidingView, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ParcelInfoCard, useMyParcel } from '@/entities/parcel';
import { ReportLostParcelForm, useReportLostParcelForm } from '@/features/report-lost-parcel';
import { useGoBack } from '@/shared/hooks';
import { Button, makeStyles, ScreenHeader, Typography, useTheme } from '@/shared/ui';

export interface ReportLostParcelPageProps {
  invoiceNumber: string;
}

/** 분실 신고 화면 (시안 C9). */
export function ReportLostParcelPage({ invoiceNumber }: ReportLostParcelPageProps) {
  const styles = useStyles();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const goBack = useGoBack();

  const { parcel, isPending, error, refetch } = useMyParcel(invoiceNumber);
  const { control, submit, isSubmitting, submitError } = useReportLostParcelForm({
    invoiceNumber,
    onSuccess: goBack,
  });

  const renderBody = () => {
    // 백그라운드 재조회가 실패해도 react-query 는 기존 데이터를 유지한다 — 택배가 있으면 폼을 우선 보여준다.
    if (parcel === undefined && error === null && isPending) {
      return (
        <View style={styles.center}>
          <ActivityIndicator
            color={colors.textBrand}
            accessibilityLabel="택배 정보를 불러오는 중"
          />
        </View>
      );
    }

    if (parcel === undefined) {
      return (
        <View style={[styles.center, styles.message]}>
          <Typography variant="bodyMStrong" align="center" accessibilityRole="alert">
            {error !== null ? '택배 정보를 불러오지 못했어요.' : '신고할 택배를 찾을 수 없어요.'}
          </Typography>
          {error !== null && (
            <Typography color="textSecondary" align="center">
              {error.message}
            </Typography>
          )}
          <View style={styles.messageActions}>
            {error !== null && (
              <Button
                label="다시 시도"
                variant="brand"
                labelVariant="bodyMStrong"
                onPress={refetch}
                style={styles.footerButton}
              />
            )}
            <Button
              label="돌아가기"
              variant="outline"
              labelVariant="bodyMStrong"
              onPress={goBack}
              style={styles.footerButton}
            />
          </View>
        </View>
      );
    }

    return (
      <KeyboardAvoidingView
        style={styles.flex}
        // Android 도 edge-to-edge 가 강제라 adjustResize 로 창이 줄지 않는다 — 두 플랫폼 모두 padding.
        behavior="padding"
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <ParcelInfoCard
            label="신고 대상 택배"
            alias={parcel.alias}
            deliveryCompany={parcel.deliveryCompany}
            invoiceNumber={parcel.invoiceNumber}
          />
          <ReportLostParcelForm control={control} />
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          {submitError !== null && (
            <Typography
              variant="caption"
              color="textDanger"
              align="center"
              accessibilityRole="alert"
            >
              {submitError}
            </Typography>
          )}
          <View style={styles.footerRow}>
            <Button
              label="취소"
              variant="outline"
              labelVariant="bodyMStrong"
              onPress={goBack}
              style={[styles.footerButton, styles.cancel]}
            />
            <Button
              label="분실 신고 제출"
              variant="brand"
              labelVariant="bodyMStrong"
              loading={isSubmitting}
              onPress={submit}
              style={[styles.footerButton, styles.submit]}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  };

  return (
    // 아래 SafeArea 는 하단 고정 버튼 영역이 insets.bottom 으로 맡는다.
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader title="분실 신고" onBack={goBack} />
      {renderBody()}
    </SafeAreaView>
  );
}

const useStyles = makeStyles(({ colors, size, spacing }) => ({
  screen: { flex: 1, backgroundColor: colors.bgApp },
  flex: { flex: 1 },
  content: {
    gap: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing['2xl'],
    paddingHorizontal: spacing.lg,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  message: { gap: spacing.sm, paddingHorizontal: spacing['2xl'] },
  messageActions: { alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.lg },
  footer: {
    gap: spacing.sm,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.bgApp,
  },
  footerRow: { flexDirection: 'row', gap: spacing.sm },
  footerButton: { height: size.buttonFooter },
  // 시안 폭 비율 취소 약 128 : 제출 약 207 (스크린샷 추정) — 디자이너 확인 필요.
  cancel: { flex: 5 },
  submit: { flex: 8 },
}));
