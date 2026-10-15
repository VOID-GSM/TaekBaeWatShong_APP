import { NotoSansKR_400Regular } from '@expo-google-fonts/noto-sans-kr/400Regular';
import { NotoSansKR_700Bold } from '@expo-google-fonts/noto-sans-kr/700Bold';

/** RN 은 커스텀 폰트의 굵기를 fontWeight 가 아니라 굵기별 fontFamily 로 고른다. */
export const fontFamily = {
  regular: 'NotoSansKR_400Regular',
  bold: 'NotoSansKR_700Bold',
} as const;

/** `useFonts(fontAssets)` 로 앱 시작 시 로드한다. 쓰는 굵기만 번들에 넣는다. */
export const fontAssets = {
  [fontFamily.regular]: NotoSansKR_400Regular,
  [fontFamily.bold]: NotoSansKR_700Bold,
};
