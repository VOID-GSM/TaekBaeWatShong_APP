import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { type IconName, icons } from '../../assets/icons';

export interface IconProps {
  name: IconName;
}

/**
 * 장식용 아이콘. 의미가 있으면 감싸는 쪽에 accessibilityLabel 을 단다.
 * 웹에서는 SvgXml 의 props 가 <svg> 로 그대로 넘어가므로 접근성 속성은 감싸는 View 에 둔다.
 */
export function Icon({ name }: IconProps) {
  const { xml, width, height } = icons[name];

  return (
    <View aria-hidden pointerEvents="none">
      <SvgXml xml={xml} width={width} height={height} />
    </View>
  );
}
