import { useId, useState } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { makeStyles, useTheme } from '../theme';

// Figma 브랜드 채움: linear-gradient(<angle>, start 14.184%, end 85.106%)
const STOPS = { start: 0.14184, end: 0.85106 };

// 웹은 absolute 요소가 일반 자식 위에 그려져 아이콘을 덮는다. 항상 자식 뒤에 깔리게 한다.
const gradientStyle = [StyleSheet.absoluteFill, { zIndex: -1 }];

export interface BrandGradientProps {
  width: number;
  height: number;
  /** CSS linear-gradient 각도(deg). 시안마다 요소 비율에 따라 달라 열어 둔다. */
  angle: number;
}

/** CSS linear-gradient 와 같은 방향·길이의 그라디언트를 부모 크기에 맞춰 깐다. */
export function BrandGradient({ width, height, angle }: BrandGradientProps) {
  const { colors } = useTheme();
  // 한 화면에 여러 개가 그려질 때(웹은 id 가 문서 전역) 겹치지 않게 한다.
  const id = `brand-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const rad = (angle * Math.PI) / 180;
  const dx = Math.sin(rad);
  const dy = -Math.cos(rad);
  const half = (Math.abs(width * dx) + Math.abs(height * dy)) / 2;

  return (
    <Svg width={width} height={height} style={gradientStyle}>
      <Defs>
        <LinearGradient
          id={id}
          gradientUnits="userSpaceOnUse"
          x1={width / 2 - dx * half}
          y1={height / 2 - dy * half}
          x2={width / 2 + dx * half}
          y2={height / 2 + dy * half}
        >
          <Stop offset={STOPS.start} stopColor={colors.bgBrandStart} />
          <Stop offset={STOPS.end} stopColor={colors.bgBrandEnd} />
        </LinearGradient>
      </Defs>
      <Rect width={width} height={height} fill={`url(#${id})`} />
    </Svg>
  );
}

export interface BrandSurfaceProps extends ViewProps {
  /** 그라디언트 각도(deg). 기본값은 정사각형 요소(아바타·전송 버튼)의 시안 값. */
  angle?: number;
}

/** 브랜드 그라디언트를 배경으로 까는 View. 첫 레이아웃 전에는 끝 색 단색으로 보인다. */
export function BrandSurface({
  angle = 131.35,
  style,
  children,
  onLayout,
  ...props
}: BrandSurfaceProps) {
  const styles = useStyles();
  const [layout, setLayout] = useState({ width: 0, height: 0 });

  return (
    <View
      {...props}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setLayout({ width, height });
        onLayout?.(event);
      }}
      style={[styles.container, style]}
    >
      {layout.width > 0 && <BrandGradient {...layout} angle={angle} />}
      {children}
    </View>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  // zIndex 0 으로 쌓임 맥락을 만들어, zIndex -1 그라디언트가 이 View 배경 밑으로 빠지지 않게 한다.
  container: { backgroundColor: colors.bgBrandEnd, overflow: 'hidden', zIndex: 0 },
}));
