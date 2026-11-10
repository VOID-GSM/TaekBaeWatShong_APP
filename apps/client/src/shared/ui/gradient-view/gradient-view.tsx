import { useId } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { gradients, type GradientToken } from '../theme';

export interface GradientViewProps extends ViewProps {
  gradient?: GradientToken;
}

/**
 * Figma 그라데이션 채우기를 깐 View. `experimental_backgroundImage` 는 웹에서 동작하지 않아
 * react-native-svg 로 그린다. 크기는 내용에 맞춰 늘어나고, 모서리는 style 의 borderRadius 로 자른다.
 */
export function GradientView({ gradient = 'brand', style, children, ...props }: GradientViewProps) {
  // useId 값의 ':' '«' 같은 문자는 SVG url(#id) 참조를 깨뜨릴 수 있어 걸러낸다.
  const id = `gradient-${useId().replace(/[^\w-]/g, '')}`;
  const { from, to, start, end, direction } = gradients[gradient];
  const x2 = direction === 'diagonal' ? '1' : '0';

  return (
    <View {...props} style={[styles.clip, style]}>
      {/* SVG 는 웹에서 기본 크기(300×150)로 레이아웃을 차지하므로 절대 위치 View 로 감싸 배경으로만 깐다. */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient id={id} x1="0" y1="0" x2={x2} y2="1">
              <Stop offset={start} stopColor={from} />
              <Stop offset={end} stopColor={to} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill={`url(#${id})`} />
        </Svg>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
});
