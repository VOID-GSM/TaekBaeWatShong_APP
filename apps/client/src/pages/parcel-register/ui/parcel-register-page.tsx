import { KeyboardAvoidingView, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RegisterParcelForm, type RegisterParcelValues } from '@/features/register-parcel';
import { makeStyles, TopBar } from '@/shared/ui';

export interface ParcelRegisterPageProps {
  /** 등록 API 가 연결되면 넘긴다. 없으면 검증만 하고 아무 일도 하지 않는다. */
  onSubmit?: (values: RegisterParcelValues) => void | Promise<void>;
}

export function ParcelRegisterPage({ onSubmit }: ParcelRegisterPageProps) {
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
          <RegisterParcelForm onSubmit={onSubmit} />
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
