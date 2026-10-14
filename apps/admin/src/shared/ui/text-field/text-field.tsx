import { TextInput, type TextInputProps, View } from 'react-native';

import { makeStyles, useTheme } from '../theme';
import { Typography } from '../typography';

export interface TextFieldProps extends TextInputProps {
  label: string;
  errorMessage?: string;
}

export function TextField({ label, errorMessage, style, ...props }: TextFieldProps) {
  const styles = useStyles();
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Typography variant="caption" color="textSecondary">
        {label}
      </Typography>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.textTertiary}
        {...props}
        style={[styles.field, errorMessage !== undefined && styles.fieldError, style]}
      />
      {errorMessage !== undefined && (
        <Typography variant="caption" color="textDanger" accessibilityRole="alert">
          {errorMessage}
        </Typography>
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
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radius.md,
    backgroundColor: colors.bgSurface,
    color: colors.textPrimary,
    fontFamily: typography.bodyL.fontFamily,
    fontSize: typography.bodyL.fontSize,
  },
  fieldError: { borderColor: colors.textDanger },
}));
