---
name: api-layer
description: 택배왔슝 서버 통신 계층 작성 규칙 — axios 클라이언트 설정, zod 스키마(@taekbae/types), TanStack Query 쿼리 키·queryOptions·mutation 훅(@taekbae/api), 토큰 저장(expo-secure-store)·갱신, 에러 처리. "API 연동", "axios 설정", "서버 통신", "엔드포인트 추가", "쿼리 훅 만들어줘", "useQuery", "mutation", "토큰 처리", "인터셉터", "응답 타입", "zod 스키마", "캐시 무효화", "invalidate" 요청이나 packages/api·packages/types를 수정하는 모든 작업에 반드시 이 스킬을 사용할 것.
---

# API Layer

## 책임 분리

| 위치                             | 담당                                                                           | 모르는 것         |
| -------------------------------- | ------------------------------------------------------------------------------ | ----------------- |
| `packages/types/src/<domain>.ts` | zod 스키마 + `z.infer` 타입 (요청·응답의 단일 진실 공급원)                     | axios, React      |
| `packages/api/src/client.ts`     | axios 인스턴스, 인터셉터, `configureApi()`                                     | Expo, 저장소 구현 |
| `packages/api/src/<domain>/`     | 요청 함수 + 쿼리 키 + queryOptions + mutation 훅                               | 화면              |
| `apps/<app>/src/shared/api/`     | `configureApi()` 호출 — baseURL(env), 토큰 저장소(secure-store), 401 처리 주입 | 도메인            |
| `apps/<app>/src/entities/<x>/`   | 훅을 감싸 도메인 UI·model과 연결                                               | axios             |

`packages/api`는 client/admin이 함께 쓰므로 Expo 모듈을 직접 import하지 않는다. 플랫폼 의존(토큰 저장, 로그아웃 이동)은 앱이 주입한다.
한 앱에서만 쓰는 요청이라도 도메인 API면 `packages/api`에 둔다. 해당 슬라이스 전용의 일회성 호출(예: 외부 서비스)만 슬라이스 `api/` 세그먼트에 둔다.

코드가 아직 없으면 `references/templates.md`의 형태로 처음 만든다. **이미 구현돼 있으면 그 코드가 기준이다** — 템플릿과 다르면 기존 코드를 따르고, 바꿔야 할 이유가 있으면 사용자에게 제안한다.

## 새 엔드포인트 추가 절차

1. **스키마** — `packages/types/src/<domain>.ts`에 응답/요청 스키마 추가 → `src/index.ts`에서 export.
   - 서버 필드명이 snake_case면 스키마에서 `.transform`으로 camelCase 변환하지 말고, 먼저 백엔드 스펙을 확인한다(변환 위치를 한 곳으로 통일하기 위함).
   - 날짜는 `z.iso.datetime()`로 받고 문자열 그대로 둔다. 포맷은 `@taekbae/utils`에서.
2. **요청 함수** — `packages/api/src/<domain>/<domain>.api.ts`. 응답은 반드시 `schema.parse(data)` — 서버 스펙이 바뀌면 화면이 아니라 여기서 바로 실패해야 원인을 찾기 쉽다.
3. **쿼리 키** — `<domain>Keys` 팩토리 하나로만 키를 만든다. 문자열 배열을 여러 곳에서 직접 쓰면 invalidate가 어긋난다.
4. **훅** — 조회는 `queryOptions()`를 export하고(`useQuery(parcelQueries.list(f))`, prefetch에서도 재사용), mutation은 `use<Action>Mutation` 훅으로 감싸 성공 시 관련 키를 invalidate한다.
5. **export** — `packages/api/src/index.ts`.
6. **확인** — `pnpm --filter @taekbae/api --filter @taekbae/types typecheck`.

## 규칙

- 응답 타입을 손으로 interface로 쓰지 않는다 — 스키마에서 `z.infer`.
- 화면에서 axios를 직접 import하지 않는다.
- 에러는 `ApiError`(템플릿 참고)로 정규화해서 UI는 `error.message`만 보여주면 되게 한다.
- `staleTime` 기본값은 QueryClient에서 정하고, 실시간성이 다른 쿼리(택배 도착 상태 등)만 개별 지정.
- 푸시 알림(expo-notifications)으로 택배 도착을 받으면 해당 쿼리 키를 invalidate하는 방식으로 화면을 갱신한다.
- 환경 변수는 `EXPO_PUBLIC_API_URL`만 앱에서 읽는다. 비밀값을 넣지 않는다.

## 테스트

`rn-testing` 스킬의 "API 훅" 항목 참고 — 요청 함수는 axios mock으로 스키마 파싱 성공/실패를, 훅은 QueryClient wrapper로 테스트한다.
