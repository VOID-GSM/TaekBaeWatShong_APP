import { KeyboardAvoidingView, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RegisterParcelForm } from '@/features/register-parcel';
import { makeStyles, TopBar } from '@/shared/ui';

/** 택배 등록 화면 (시안 C6). */
export function ParcelRegisterPage() {
  const styles = useStyles();

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <TopBar title="택배 등록" />
      {/* Android 는 edge-to-edge 라 창 리사이즈에 기댈 수 없어 iOS 와 같은 방식으로 피한다. */}
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <RegisterParcelForm />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles(({ colors, spacing }) => ({
  screen: { flex: 1, backgroundColor: colors.bgApp },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
}));
