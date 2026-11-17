import { useState } from 'react';
import { type StyleProp, TextInput, type TextInputProps, View, type ViewStyle } from 'react-native';

import { makeStyles, useTheme } from '../theme';
import { Typography } from '../typography';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  /** 입력 위에 보이는 라벨. 스크린 리더 이름으로도 쓴다(accessibilityLabel 이 없을 때). */
  label: string;
  /** 있으면 테두리를 빨갛게 하고 입력 아래에 문구를 보여준다. */
  error?: string;
  /** 라벨·입력·에러를 감싸는 바깥 View 스타일 */
  style?: StyleProp<ViewStyle>;
}

/** 라벨 + 흰 입력 카드 (시안 C9). react-hook-form 은 모르고 `Controller` 로 연결한다. */
export function TextField({
  label,
  error,
  multiline = false,
  accessibilityLabel,
  onFocus,
  onBlur,
  style,
  ...props
}: TextFieldProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const hasError = error !== undefined && error !== '';

  return (
    <View style={[styles.container, style]}>
      <Typography variant="bodyMStrong" color="textSecondary">
        {label}
      </Typography>
      <TextInput
        placeholderTextColor={colors.textTertiary}
        {...props}
        multiline={multiline}
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={hasError ? error : props.accessibilityHint}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        // 여러 줄은 Android 에서도 위에서부터 쓰게 한다.
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[
          styles.input,
          multiline ? styles.multiline : styles.singleLine,
          focused && styles.focused,
          hasError && styles.invalid,
        ]}
      />
      {hasError && (
        <Typography variant="caption" color="textDanger" accessibilityLiveRegion="polite">
          {error}
        </Typography>
      )}
    </View>
  );
}

const useStyles = makeStyles(({ borderWidth, colors, radius, size, spacing, typography }) => ({
  container: { gap: spacing.sm },
  input: {
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: borderWidth.thin,
    borderColor: colors.borderDefault,
    backgroundColor: colors.bgSurface,
    color: colors.textPrimary,
    fontFamily: typography.bodyMStrong.fontFamily,
    fontSize: typography.bodyMStrong.fontSize,
  },
  // 한 줄 입력에 lineHeight 를 주면 iOS 에서 글자가 위로 치우쳐 높이만 고정한다.
  singleLine: { height: size.inputM },
  multiline: {
    minHeight: size.inputMultiline,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    lineHeight: typography.bodyMStrong.lineHeight,
  },
  // 포커스·에러 테두리 색은 시안에 없어 임의로 정했다 — 디자이너 확인 필요.
  focused: { borderColor: colors.textBrand },
  invalid: { borderColor: colors.textDanger },
}));
