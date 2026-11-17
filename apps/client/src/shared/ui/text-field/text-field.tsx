import { useState } from 'react';
import { type StyleProp, TextInput, type TextInputProps, View, type ViewStyle } from 'react-native';

import { makeStyles, useTheme } from '../theme';
import { Typography } from '../typography';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  /** 입력 위에 보이는 라벨. 스크린 리더 이름으로도 쓴다(accessibilityLabel 이 없을 때). */
  label: string;
  /** 필수 입력이면 화면 라벨 뒤에 `*` 를 붙이고, 스크린 리더에는 "필수"로 읽어 준다. */
  required?: boolean;
  /** 입력 아래 안내 문구. 에러가 있으면 에러 문구로 바뀐다. */
  helperText?: string;
  /** 있으면 테두리를 빨갛게 하고 입력 아래에 문구를 보여준다. */
  error?: string;
  /** 한 줄 입력 높이. m: 48(분실 신고 C9) · l: 52(택배 등록 C6) */
  size?: 'm' | 'l';
  /** 라벨·입력·에러를 감싸는 바깥 View 스타일 */
  style?: StyleProp<ViewStyle>;
}

/** 초점·에러일 때 테두리 두께 (Figma `border-focus` 2px) */
const EMPHASIS_BORDER_WIDTH = 2;

/** 라벨 + 흰 입력 카드. react-hook-form 은 모르고 `Controller` 로 연결한다. */
export function TextField({
  label,
  required = false,
  helperText,
  error,
  size = 'm',
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
      {/* 라벨은 입력의 accessibilityLabel 로 읽히므로, 화면 글자("… *")는 스크린 리더에서 뺀다. */}
      <Typography
        variant="bodyMStrong"
        color="textSecondary"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {required ? `${label} *` : label}
      </Typography>
      <TextInput
        placeholderTextColor={colors.textTertiary}
        {...props}
        multiline={multiline}
        accessibilityLabel={accessibilityLabel ?? (required ? `${label}, 필수` : label)}
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
          multiline ? styles.multiline : styles[size],
          focused && styles.focused,
          hasError && styles.invalid,
          (focused || hasError) && styles.emphasis,
        ]}
      />
      {hasError ? (
        <Typography variant="caption" color="textDanger" accessibilityLiveRegion="polite">
          {error}
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
    // 웹 브라우저의 기본 초점 외곽선 대신 테두리 색으로 초점을 보여 준다.
    // 브라우저 기본값(outline-style: auto)은 두께를 무시하므로 모양도 지정한다.
    outlineStyle: 'solid',
    outlineWidth: 0,
  },
  // 한 줄 입력에 lineHeight 를 주면 iOS 에서 글자가 위로 치우쳐 높이만 고정한다.
  m: { height: size.inputM },
  l: { height: size.field },
  multiline: {
    minHeight: size.inputMultiline,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    lineHeight: typography.bodyMStrong.lineHeight,
  },
  focused: { borderColor: colors.borderFocus },
  invalid: { borderColor: colors.textDanger },
  // 테두리가 두꺼워진 만큼 안쪽 여백을 줄여 글자가 움직이지 않게 한다.
  emphasis: {
    borderWidth: EMPHASIS_BORDER_WIDTH,
    paddingHorizontal: spacing.lg - (EMPHASIS_BORDER_WIDTH - borderWidth.thin),
  },
}));
