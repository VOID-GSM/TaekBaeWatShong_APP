import { StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { logoMarkXml } from '../../assets/logo-mark';
import { radius, shadow, size } from '../theme';

export interface LogoMarkProps {
  accessibilityLabel?: string;
}

/**
 * 벡터로 그려 어떤 화면 배율에서도 선명하다.
 * 시안(C1)의 바깥 그림자는 SVG 필터(feMorphology) 대신 `shadow.logo` 로 그린다.
 */
export function LogoMark({ accessibilityLabel = '택배왔슝' }: LogoMarkProps) {
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={styles.body}
    >
      <SvgXml xml={logoMarkXml} width={size.logoMark} height={size.logoMark} />
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    width: size.logoMark,
    height: size.logoMark,
    borderRadius: radius.logoMark,
    ...shadow.logo,
  },
});
