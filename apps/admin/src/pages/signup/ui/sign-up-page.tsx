import { useRouter } from 'expo-router';
import { Controller } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { type SignUpFormValues, useSignUpForm } from '@/features/sign-up';
import { Badge, Button, GoogleIcon, makeStyles, TextField, TopBar, Typography } from '@/shared/ui';

export interface SignUpPageProps {
  /** 가입 API 가 정해지면 연결한다. 없으면 검증만 하고 아무 일도 하지 않는다. */
  onSubmit?: (values: SignUpFormValues) => void | Promise<void>;
}

export function SignUpPage({ onSubmit }: SignUpPageProps) {
  const styles = useStyles();
  const router = useRouter();
  const { form, onSubmit: handleSubmit, isSubmitting } = useSignUpForm(onSubmit);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <TopBar title="회원가입" onBack={handleBack} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <View style={styles.heading}>
            <Typography variant="titlePage" accessibilityRole="header">
              관리자 가입
            </Typography>
            <Typography variant="bodyM" color="textSecondary">
              이름만 입력하면 가입이 끝나요
            </Typography>
          </View>

          <View style={styles.account}>
            <GoogleIcon />
            <Typography variant="bodyM" style={styles.flex}>
              Google 계정 연결됨
            </Typography>
            <Badge label="인증 완료" tone="success" />
          </View>

          <Controller
            control={form.control}
            name="name"
            render={({ field, fieldState }) => (
              <TextField
                label="이름"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                errorMessage={fieldState.error?.message}
                autoCapitalize="words"
                autoComplete="name"
                returnKeyType="done"
                onSubmitEditing={() => void handleSubmit()}
              />
            )}
          />

          <View style={styles.flex} />

          <Button
            variant="brand"
            label="가입 완료"
            loading={isSubmitting}
            onPress={() => void handleSubmit()}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles(({ colors, radius, spacing }) => ({
  screen: { flex: 1, backgroundColor: colors.bgApp },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    gap: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  heading: { gap: spacing.xs },
  account: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.bgSurface,
  },
}));
