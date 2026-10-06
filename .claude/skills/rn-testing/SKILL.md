---
name: rn-testing
description: 택배왔슝 테스트 작성 규칙 — Jest(jest-expo) + React Native Testing Library로 컴포넌트·훅·zod 스키마·API 요청 함수·zustand 스토어를 테스트하고, Expo 네이티브 모듈(secure-store, router, notifications, camera)을 mock한다. "테스트 작성", "테스트 코드", "test 추가", "jest", "테스트 깨짐", "테스트 실패 고쳐줘", "커버리지", "mock", "RNTL" 요청이나 기능 구현 후 검증 테스트를 추가할 때 반드시 이 스킬을 사용할 것.
---

# RN Testing

실행: `pnpm --filter @taekbae/<app> test` (전체는 `pnpm test`). 단일 파일: `pnpm --filter @taekbae/client exec jest src/entities/parcel`.

## 무엇을 테스트하나 (계층별)

| 대상                           | 테스트 내용                                        | 우선순위 |
| ------------------------------ | -------------------------------------------------- | -------- |
| `@taekbae/types` 스키마        | 정상 응답 parse 성공, 필드 누락/타입 오류 시 실패  | 높음     |
| `@taekbae/api` 요청 함수       | axios mock → 스키마 파싱, 에러 → `ApiError` 정규화 | 높음     |
| `@taekbae/utils`               | 순수 함수 입출력, 경계값                           | 높음     |
| features `model` (폼 훅, 로직) | 검증 메시지, 제출 시 mutation 호출                 | 높음     |
| zustand 스토어                 | 액션 → 상태 변화                                   | 중간     |
| entities/shared `ui`           | 렌더, 상태별 표시(로딩/빈/에러), 상호작용 콜백     | 중간     |
| pages                          | 핵심 흐름 smoke 테스트만                           | 낮음     |

스냅샷 테스트는 쓰지 않는다 — 스타일 변경마다 깨져서 아무도 안 읽는 테스트가 된다.

## 파일 위치 / 이름

대상 옆에 `*.test.ts(x)`: `entities/parcel/ui/parcel-card.test.tsx`. 패키지(`packages/*`)도 동일.
packages에 jest 설정이 아직 없으면 처음 테스트를 추가할 때 `references/setup.md`대로 만든다.

## RNTL 작성 원칙

- 사용자가 보는 것으로 찾는다: `getByRole('button', { name: '수령 완료' })` > `getByText` > `getByTestId`(최후).
- 상호작용은 `userEvent` (`const user = userEvent.setup(); await user.press(...)`), 비동기 결과는 `findBy*` / `waitFor`.
- 구현 세부(state 값, 내부 함수 호출 횟수)가 아니라 결과(화면에 보이는 것, 콜백 인자)를 검증한다.
- 테마/쿼리 등 Provider가 필요하면 `shared/lib/test-utils.tsx`의 `renderWithProviders`를 쓴다 (없으면 `references/setup.md`로 생성).

## Mock

공통 mock은 앱의 `jest.setup.js`에, 개별 동작은 테스트 파일에서. 템플릿은 `references/setup.md`.

- `expo-secure-store` — 메모리 Map
- `expo-router` — `useRouter`의 push/replace를 `jest.fn()`
- `expo-notifications`, `expo-camera` — 필요한 함수만 최소 mock
- API — packages/api 안에서는 `../client`를 mock하고, 앱에서는 `@taekbae/api` 부분 mock 또는 `queryClient.setQueryData`로 캐시를 채운다(내부 경로 mock은 `exports` 때문에 불가). 네트워크를 실제로 타지 않는다.

## 테스트 실패를 고칠 때

먼저 테스트가 맞는지 코드가 맞는지 판단한다. 코드가 의도대로인데 테스트가 구현 세부에 묶여 있었다면 테스트를 고치고, 동작이 바뀐 것이면 코드를 고친다. 테스트를 통과시키려고 assertion을 지우지 않는다.
