import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { type IconName, icons } from '../../assets/icons';
import { type ColorToken, useTheme } from '../theme';

export interface IconProps {
  name: IconName;
  /** 선 색. 없으면 아이콘마다 정한 기본 색을 쓴다. */
  color?: ColorToken;
  /** 정사각형 아이콘의 한 변. 없으면 시안 크기 그대로다. */
  size?: number;
}

/**
 * 장식용 아이콘. 의미가 있으면 감싸는 쪽에 accessibilityLabel 을 단다.
 * 웹에서는 SvgXml 의 props 가 <svg> 로 그대로 넘어가므로 접근성 속성은 감싸는 View 에 둔다.
 */
export function Icon({ name, color, size }: IconProps) {
  const { colors } = useTheme();
  const icon = icons[name];
  const tone = color ?? ('color' in icon ? icon.color : undefined);

  return (
    <View aria-hidden pointerEvents="none">
      <SvgXml
        xml={icon.xml}
        width={size ?? icon.width}
        height={size ?? icon.height}
        color={tone ? colors[tone] : undefined}
      />
    </View>
  );
}
