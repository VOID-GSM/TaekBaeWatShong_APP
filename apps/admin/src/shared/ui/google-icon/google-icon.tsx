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

  return (
    <SvgXml
      xml={googleGXml}
      width={iconSize}
      height={iconSize}
      accessible={false}
      importantForAccessibility="no"
    />
  );
}
