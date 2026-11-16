import { useState } from 'react';
import { TextInput, type TextInputProps, View } from 'react-native';

import { makeStyles, useTheme } from '../theme';
import { Typography } from '../typography';

export interface TextFieldProps extends TextInputProps {
  label: string;
  /** 입력칸 아래 안내 문구. 에러가 있으면 에러 문구로 바뀐다. */
  helperText?: string;
  errorMessage?: string;
}

const BORDER = { default: 1, focused: 2 };

export function TextField({
  label,
  helperText,
  errorMessage,
  style,
  onFocus,
  onBlur,
  ...props
}: TextFieldProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const hasError = errorMessage !== undefined;

  return (
    <View style={styles.container}>
      <Typography variant="bodyMStrong" color="textSecondary">
        {label}
      </Typography>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.textTertiary}
        {...props}
        onFocus={(event) => {
          setIsFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setIsFocused(false);
          onBlur?.(event);
        }}
        style={[
          styles.field,
          isFocused && styles.focused,
          hasError && styles.error,
          (isFocused || hasError) && styles.thickBorder,
          style,
        ]}
      />
      {hasError ? (
        <Typography variant="bodyMStrong" color="textDanger" accessibilityRole="alert">
          {errorMessage}
        </Typography>
      ) : (
        helperText !== undefined && (
          <Typography variant="bodyMStrong" color="textTertiary">
            {helperText}
          </Typography>
        )
      )}
    </View>
  );
}

const useStyles = makeStyles(({ colors, radius, size, spacing, typography }) => ({
  container: { alignSelf: 'stretch', gap: spacing.sm },
  field: {
    height: size.field,
    paddingHorizontal: spacing.lg,
    paddingVertical: 0,
    borderWidth: BORDER.default,
    borderColor: colors.borderDefault,
    borderRadius: radius.md,
    backgroundColor: colors.bgSurface,
    color: colors.textPrimary,
    fontFamily: typography.bodyMStrong.fontFamily,
    fontSize: typography.bodyMStrong.fontSize,
    // 웹 브라우저의 기본 초점 외곽선 대신 위 테두리 색으로 초점을 보여 준다.
    // 브라우저 기본값(outline-style: auto)은 두께를 무시하므로 모양도 지정한다.
    outlineStyle: 'solid',
    outlineWidth: 0,
  },
  focused: { borderColor: colors.borderFocus },
  error: { borderColor: colors.textDanger },
  // 테두리가 두꺼워진 만큼 안쪽 여백을 줄여 글자가 움직이지 않게 한다.
  thickBorder: {
    borderWidth: BORDER.focused,
    paddingHorizontal: spacing.lg - (BORDER.focused - BORDER.default),
  },
}));
