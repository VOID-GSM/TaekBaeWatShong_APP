---
name: figma-to-rn
description: Figma 디자인을 택배왔슝 React Native(Expo) 코드로 옮긴다 — Figma MCP로 디자인 컨텍스트를 가져와 웹 코드를 RN 프리미티브로 변환하고, 색·폰트·간격을 디자인 토큰에 매핑하고, FSD 계층에 배치한다. Figma URL(figma.com/design/...)이 주어지거나 "피그마대로 만들어줘", "시안 구현", "디자인 보고 화면 만들어줘", "Figma 토큰 가져와", "피그마 색상 반영", "디자인이랑 다른 부분 맞춰줘" 요청 시 반드시 이 스킬을 사용할 것.
---

# Figma → React Native

## 1. 디자인 컨텍스트 가져오기

- Figma MCP의 `get_design_context`를 부르기 **전에 반드시 `figma:figma-design-to-code` 스킬을 로드**한다(해당 플러그인의 필수 선행 조건).
- 화면 전체보다 **프레임/컴포넌트 단위**로 가져온다 — 컨텍스트가 작을수록 변환 정확도가 높다.
- Figma 인증이 안 되어 있으면 `figma` MCP의 authenticate 흐름을 안내한다.
- 변수(Variables)/스타일이 정의된 파일이면 색·타이포 토큰을 먼저 추출해 `shared/ui/theme`에 반영한 뒤 컴포넌트 작업을 한다(`ui-system` 스킬).

## 2. 웹 → RN 변환 규칙

MCP가 주는 코드는 대개 React + Tailwind(웹)다. 구조와 수치만 참고하고 그대로 쓰지 않는다.

| 웹                       | React Native                                                    |
| ------------------------ | --------------------------------------------------------------- |
| `div`                    | `View`                                                          |
| 텍스트 노드, `span`, `p` | `Typography`(shared/ui) — RN은 텍스트가 반드시 `Text` 안        |
| `img`                    | `Image` (`expo-image` 미설치 → RN `Image`)                      |
| `button`, `onClick`      | `Pressable`, `onPress`                                          |
| `flex` (기본 row)        | `flexDirection: 'row'` 명시 — RN 기본은 column                  |
| `gap-*`                  | `gap` (RN 0.71+ 지원)                                           |
| `box-shadow`             | 토큰 `shadow.*` (iOS shadow + Android elevation)                |
| `border: 1px solid`      | `borderWidth: 1, borderColor` (또는 `StyleSheet.hairlineWidth`) |
| `position: fixed`        | 화면 루트에서 `position: 'absolute'` + SafeArea inset           |
| `overflow: scroll`       | `ScrollView` / `FlatList`                                       |
| `%`, `vh`, `vw`          | flex 비율, `useWindowDimensions()`                              |
| `font-family` 웹폰트     | `expo-font`로 로드 필요 — 미설정이면 사용자에게 확인            |

- 수치: Figma 프레임 폭이 375(또는 390)이면 px를 dp로 1:1 사용. 고정 width보다 flex/padding으로 표현해 다양한 화면에 대응.
- 절대 위치(absolute) 남발된 export는 flex 레이아웃으로 재구성한다.
- hex 색상을 하드코딩하지 않는다. 토큰에 가장 가까운 의미 색으로 매핑하고, 없으면 토큰을 추가한다(어떤 토큰을 추가했는지 보고).

## 3. 배치

`fsd-slice` 스킬의 계층 표로 판단한다.

- 도메인 없는 원자 컴포넌트(버튼, 입력, 칩, 카드 틀) → `shared/ui`
- 택배 카드처럼 도메인 데이터를 표시 → `entities/<x>/ui`
- 화면 섹션 묶음 → `widgets`, 화면 → `pages`
  Figma 컴포넌트 이름이 기존 `shared/ui` 컴포넌트와 겹치면 새로 만들지 말고 기존 것에 variant를 추가한다.

## 4. 에셋

- 이미지/일러스트는 MCP가 주는 에셋 URL에서 받아 `shared/assets/`에 저장(@2x/@3x).
- 아이콘: SVG 라이브러리가 설치돼 있지 않으므로 처음 아이콘이 필요할 때 방식(`@expo/vector-icons` / `react-native-svg`)을 사용자에게 확인한다.

## 5. 검수

- 가능하면 `run` 스킬로 앱을 띄워 스크린샷을 찍고 Figma 스크린샷(`get_screenshot`)과 나란히 비교한다. 간격·폰트 크기·색 차이를 목록으로 보고.
- 라이트/다크 둘 다 확인 (Figma에 다크 시안이 없으면 토큰 기반 결과를 보여주고 확인 요청).
- 디자인에 없는 상태(로딩, 빈 목록, 에러, 긴 텍스트 말줄임, 비활성 버튼)를 어떻게 처리했는지 보고한다 — 디자이너에게 되물을 항목이 된다.
