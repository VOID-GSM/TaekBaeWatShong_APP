import { Text, type TextProps } from 'react-native';

import { type ColorToken, type TypographyVariant, useTheme } from '../theme';

export interface TypographyProps extends TextProps {
  variant?: TypographyVariant;
  color?: ColorToken;
  align?: 'left' | 'center' | 'right';
}

export function Typography({
  variant = 'bodyM',
  color = 'textPrimary',
  align,
  style,
  ...props
}: TypographyProps) {
  const { colors, typography } = useTheme();

  return (
    <Text
      {...props}
      style={[typography[variant], { color: colors[color], textAlign: align }, style]}
    />
  );
}
