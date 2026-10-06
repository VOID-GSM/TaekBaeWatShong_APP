# 택배왔슝 리뷰 체크리스트

## 1. FSD 계층 (apps/client, apps/admin)

계층 순서: `app → pages → widgets → features → entities → shared`

- [ ] **의존 방향**: 하위 계층이 상위 계층을 import하지 않는다. (예: `entities/*`가 `@/features/*`를 import → [필수])
- [ ] **같은 계층 슬라이스 간 import 금지**: `features/a`가 `features/b`를 직접 import하면 안 된다. 공통 로직은 아래 계층(entities/shared)으로 내리거나 위 계층(widgets/pages)에서 조합한다. `shared`와 `app`은 슬라이스가 없으므로 예외.
- [ ] **public API**: 슬라이스 외부에서는 `@/entities/parcel`처럼 `index.ts`를 통해서만 가져온다. `@/entities/parcel/ui/parcel-card` 같은 deep import는 [권장] 이상.
- [ ] **슬라이스 내부는 상대 경로**: 같은 슬라이스 안에서 자기 `index.ts`를 import하면 순환 참조가 생긴다.
- [ ] **세그먼트 배치**: 컴포넌트는 `ui/`, 상태·훅·비즈니스 로직은 `model/`, 슬라이스 전용 요청은 `api/`, 헬퍼는 `lib/`. 필요한 세그먼트만 만든다.
- [ ] **도메인 판단**: 특정 도메인(택배, 사용자, 알림 등)을 아는 코드가 `shared`에 들어가면 안 된다. 반대로 도메인 중립 코드가 entities에 있으면 shared로.
- [ ] **pages는 조합만**: 페이지에 비즈니스 로직이 쌓이면 features/widgets로 추출을 제안.

## 2. Expo Router

- [ ] 라우트 루트는 `src/app/routes/`. 이 폴더에는 `_layout.tsx`와 라우트 파일만 있어야 한다 — 그 외 `.ts/.tsx`는 의도치 않은 라우트가 된다. [필수]
- [ ] 라우트 파일은 `export { HomePage as default } from '@/pages/home';` 처럼 pages를 re-export하는 한 줄이 원칙.
- [ ] Provider 등 라우트가 아닌 app 계층 코드는 `src/app/providers/`.

## 3. 모노레포 패키지

- [ ] `packages/types`(타입·zod 스키마), `packages/api`(API 클라이언트·서버 상태 훅), `packages/utils`(도메인 중립 유틸)의 역할을 지킨다.
- [ ] client/admin에 같은 코드가 중복되면 packages로 올릴지 [권장].
- [ ] packages는 앱(`apps/*`)을 import하지 않는다. [필수]
- [ ] 새 의존성은 실제로 쓰는 워크스페이스의 package.json에 추가됐는지 (루트에 앱 의존성 추가 금지). lockfile 변경 동반 여부.

## 4. React Native / Expo

- [ ] 플랫폼 분기(`Platform.OS`)가 필요한 API(권한, 알림, 카메라)에서 iOS/Android 모두 고려했는지.
- [ ] `expo-secure-store`로 저장해야 할 토큰을 AsyncStorage에 넣지 않았는지. [필수]
- [ ] 리스트는 `FlatList`/`FlashList` + 안정적인 `keyExtractor`. `ScrollView` + `map`으로 긴 목록 렌더 → [권장].
- [ ] 인라인 스타일 객체 남발 대신 `StyleSheet.create` / `makeStyles`.
- [ ] hex 색상·임의 fontSize/margin 하드코딩 대신 `shared/ui/theme` 토큰 사용 (`ui-system` 스킬 기준). [권장]
- [ ] 이미지·아이콘 등 에셋 경로, 다크모드/안전영역(SafeArea) 처리.
- [ ] 애니메이션은 Reanimated, 터치 요소는 `Pressable` + 접근성 라벨.

## 5. 서버 상태 (TanStack Query / axios)

- [ ] 쿼리 키가 일관된 팩토리로 관리되는지, 같은 데이터에 다른 키를 쓰지 않는지.
- [ ] mutation 후 관련 쿼리 invalidate 누락.
- [ ] 응답을 zod 스키마(`@taekbae/types`)로 검증하는 경계가 있는지.
- [ ] 에러/로딩 상태 UI 처리 누락.

## 6. TypeScript / 코드 품질

- [ ] `any` 사용 (eslint warn이지만 리뷰에서 대안 제시), 불필요한 `as` 단언, non-null `!` 남용.
- [ ] `import type` 일관성 (eslint `consistent-type-imports`).
- [ ] 죽은 코드, console.log 잔존.
- [ ] 네이밍: 컴포넌트 PascalCase, 파일 kebab-case (기존 `app-providers.tsx` 관례).

## 7. 보안 / 환경 변수

- [ ] `EXPO_PUBLIC_*`에 비밀값이 들어가지 않았는지 — 번들에 평문으로 박힌다. [필수]
- [ ] `.env`, 키 파일(`*.jks`, `*.p8` 등)이 커밋되지 않았는지. [필수]
- [ ] EAS projectId는 env가 아니라 `app.config.ts`의 리터럴이어야 한다 (README 참고).

## 8. 커밋 / PR 규칙

- [ ] PR 제목 `[type] 요약`, base가 develop(hotfix·release 제외).
- [ ] 커밋 메시지 `type: 요약`, 커밋이 기능 단위로 나뉘었는지. 거대한 단일 커밋이면 [권장]으로 언급.
- [ ] PR 템플릿 섹션이 채워졌는지.
