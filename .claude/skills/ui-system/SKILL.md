---
name: ui-system
description: 택배왔슝 React Native UI 구현 규칙 — 디자인 토큰(색상·타이포·간격·radius·그림자), shared/ui 컴포넌트 작성법, StyleSheet 스타일링, 다크모드, SafeArea, 접근성, 터치 피드백, Reanimated 애니메이션, 리스트 성능. "디자인 적용", "UI 만들어줘", "컴포넌트 만들어줘", "버튼/카드/모달/바텀시트", "스타일 수정", "색상 바꿔줘", "다크모드", "애니메이션", "레이아웃 깨짐", "디자인 시스템", "테마", "토큰" 요청이나 화면·컴포넌트의 시각 요소를 작성/수정하는 모든 작업에 반드시 이 스킬을 사용할 것. Figma 링크가 있으면 figma-to-rn 스킬과 함께 사용.
---

# UI System

이 앱은 별도 스타일 라이브러리 없이 `StyleSheet` + 디자인 토큰을 쓴다. 토큰을 쓰는 이유: 색 하나 바꿀 때 파일 30개를 뒤지지 않기 위해, 그리고 다크모드를 한 곳에서 처리하기 위해서다.

## 1. 토큰

위치: `apps/<app>/src/shared/ui/theme/` (`colors.ts`, `typography.ts`, `spacing.ts`, `index.ts`).
아직 없으면 `references/theme-template.md`로 만든다. 디자인(Figma)에서 값을 받으면 템플릿의 placeholder 값을 교체한다.

- 컴포넌트에서 hex 색상, 임의 숫자 fontSize/margin을 쓰지 않는다. 필요한 값이 토큰에 없으면 **토큰을 먼저 추가**하고 쓴다.
- 색상 토큰은 원색 이름(`blue500`)이 아니라 의미 이름(`primary`, `textSecondary`, `border`, `danger`)으로 쓴다 — 다크모드에서 같은 이름이 다른 값을 가리킬 수 있게.
- 간격은 4의 배수 스케일(`spacing[1]=4 … spacing[6]=24`).
- client/admin이 같은 토큰을 복붙하게 되면 `packages/ui`로 올리는 것을 사용자에게 제안한다(지금은 만들지 않음).

## 2. 다크모드

`app.config.ts`가 `userInterfaceStyle: 'automatic'`이다. `useTheme()`(템플릿 제공)으로 현재 scheme의 색을 가져오고, 색이 들어가는 스타일은 `makeStyles` 패턴으로 테마에 따라 생성한다. 크기·레이아웃만 있는 스타일은 일반 `StyleSheet.create`.

## 3. shared/ui 컴포넌트 작성법

- 폴더: `shared/ui/<component>/` + `index.ts`, `shared/ui/index.ts`에서 재export.
- 도메인을 모른다: `ParcelCard`는 `entities/parcel/ui`, `Card`는 `shared/ui`.
- Props: RN 기본 props를 확장(`extends PressableProps`)하고 `style`을 받아 마지막에 합친다. variant는 문자열 유니온(`variant?: 'primary' | 'secondary' | 'ghost'`), size도 유니온.
- 터치 요소는 `Pressable` + pressed 상태 피드백(opacity/배경), 최소 터치 영역 44×44 (`hitSlop` 활용).
- 접근성: `accessibilityRole`, `accessibilityLabel`(아이콘 버튼 필수), `accessibilityState={{ disabled, selected }}`.
- 텍스트는 직접 `<Text>` 대신 `Typography` 컴포넌트(variant 기반)를 써서 폰트 일관성 유지. `allowFontScaling` 기본 유지.
- 로딩/빈 상태/에러 상태 UI를 컴포넌트 단위로 준비 (`Skeleton`, `EmptyState`, `ErrorView`).

## 4. 레이아웃

- RN의 flex 기본 방향은 **column**이다 (웹과 다름). 웹 디자인/코드를 옮길 때 주의.
- 화면 루트는 `SafeAreaView`(react-native-safe-area-context) 또는 `useSafeAreaInsets`. 하단 고정 버튼은 `insets.bottom` 반영.
- 긴 목록은 `FlatList` + `keyExtractor` + 메모이즈된 `renderItem`. `ScrollView` 안에 `map`으로 수십 개 이상 렌더하지 않는다.
- 키보드가 가리는 입력 화면은 `KeyboardAvoidingView`(iOS `behavior="padding"`).
- 그림자: iOS `shadow*` + Android `elevation`을 둘 다 지정 → 토큰 `shadow.card`처럼 묶어서 쓴다.

## 5. 애니메이션

- `react-native-reanimated` v4 사용 (`useSharedValue`, `useAnimatedStyle`, `withTiming/withSpring`, layout animation `entering={FadeIn}`). RN `Animated` API는 쓰지 않는다.
- 제스처는 `react-native-gesture-handler`의 `Gesture` API.
- duration·easing도 토큰처럼 상수화(`motion.fast = 150`).
- 사용자 설정 "동작 줄이기"를 존중: `useReducedMotion()`.

## 6. 아이콘 / 이미지

- 이미지 에셋은 `shared/assets/`. 해상도별 `@2x`, `@3x` 제공.
- 아이콘 라이브러리/`react-native-svg`는 현재 설치돼 있지 않다. 필요하면 추가 전에 사용자에게 어떤 방식을 쓸지 확인한다(`@expo/vector-icons` vs SVG 컴포넌트).

## 7. 확인

- 라이트/다크 둘 다, 작은 화면(iPhone SE)과 큰 화면에서 깨지지 않는지 — 가능하면 `run` 스킬로 실제 실행해 스크린샷.
- `pnpm --filter @taekbae/<app> lint typecheck`
