import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { logoMarkXml } from '../../assets/logo-mark';
import { size } from '../theme';

export interface LogoMarkProps {
  accessibilityLabel?: string;
}

/** 벡터로 그려 어떤 화면 배율에서도 선명하다. */
export function LogoMark({ accessibilityLabel = '택배왔슝' }: LogoMarkProps) {
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      <SvgXml xml={logoMarkXml} width={size.logoMark} height={size.logoMark} />
    </View>
  );
}
