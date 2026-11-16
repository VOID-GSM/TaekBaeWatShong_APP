import { View } from 'react-native';

import { makeStyles } from '../theme';
import { Typography } from '../typography';

export interface TopBarProps {
  title: string;
}

/** 탭 첫 화면의 왼쪽 제목 (Figma `TopBar/Title`). */
export function TopBar({ title }: TopBarProps) {
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <Typography variant="bodyMStrong" numberOfLines={1} accessibilityRole="header">
        {title}
      </Typography>
    </View>
  );
}

const useStyles = makeStyles(({ size, spacing }) => ({
  container: {
    justifyContent: 'center',
    height: size.topBar,
    paddingHorizontal: spacing.xl,
  },
}));
