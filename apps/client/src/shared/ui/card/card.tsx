import { View, type ViewProps } from 'react-native';

import { makeStyles } from '../theme';

export interface CardProps extends ViewProps {
  /** xl(26): 큰 카드, lg(22): 목록 행 */
  rounded?: 'lg' | 'xl';
}

/** 흰 배경 + Shadow/Card + 안쪽 여백 16 의 카드 틀. */
export function Card({ rounded = 'xl', style, ...props }: CardProps) {
  const styles = useStyles();

  return <View {...props} style={[styles.card, styles[rounded], style]} />;
}

const useStyles = makeStyles(({ colors, radius, shadow, spacing }) => ({
  card: {
    alignSelf: 'stretch',
    padding: spacing.lg,
    backgroundColor: colors.bgSurface,
    ...shadow.card,
  },
  lg: { borderRadius: radius.lg },
  xl: { borderRadius: radius.xl },
}));
