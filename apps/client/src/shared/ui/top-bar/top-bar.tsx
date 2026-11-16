import { View } from 'react-native';

import { makeStyles } from '../theme';
import { Typography } from '../typography';

export interface TopBarProps {
  title: string;
}

/** 화면 제목 바(높이 56). */
export function TopBar({ title }: TopBarProps) {
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <Typography
        variant="titlePage"
        accessibilityRole="header"
        numberOfLines={1}
        style={styles.title}
      >
        {title}
      </Typography>
    </View>
  );
}

const useStyles = makeStyles(({ size, spacing }) => ({
  container: {
    height: size.topBar,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: { flex: 1 },
}));
