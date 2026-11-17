import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { googleGXml } from '../../assets/google-g';
import { useTheme } from '../theme';

export interface GoogleIconProps {
  size?: number;
}

/** 장식용 아이콘 — 버튼 라벨이 의미를 전달하므로 스크린리더에서는 숨긴다. */
export function GoogleIcon({ size }: GoogleIconProps) {
  const theme = useTheme();
  const iconSize = size ?? theme.size.iconM;

  // 접근성 속성은 View 에 둔다. SvgXml 에 주면 웹에서 <svg> 의 알 수 없는 DOM 속성이 되어 경고가 난다.
  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <SvgXml xml={googleGXml} width={iconSize} height={iconSize} />
    </View>
  );
}
