---
name: fsd-slice
description: 택배왔슝 앱(client/admin)에 FSD 슬라이스·페이지·라우트를 만들고 코드를 올바른 계층/세그먼트에 배치한다. 폼(react-hook-form + zod), 전역 상태(zustand) 배치 규칙 포함. "화면 만들어줘", "페이지 추가", "기능 추가", "슬라이스 만들어줘", "entities/features 어디에 둬?", "라우트 추가", "폼 만들어줘", "상태 관리 추가", "폴더 구조 잡아줘", "이 코드 어느 계층?" 요청이나, apps/*/src 아래에 새 파일을 만드는 모든 개발 작업에서 반드시 이 스킬을 사용할 것.
---

# FSD Slice

README의 FSD 규칙을 실제로 코드를 만들 때 적용하는 방법이다. 의존 방향: `app → pages → widgets → features → entities → shared`.

## 1. 계층 결정

새 코드를 만들기 전에 "이 코드는 무엇을 아는가?"로 계층을 정한다.

| 질문                                                      | 계층       | 택배왔슝 예시                                    |
| --------------------------------------------------------- | ---------- | ------------------------------------------------ |
| 도메인을 전혀 모르는가? (버튼, 날짜 포맷, axios 인스턴스) | `shared`   | `shared/ui/button`, `shared/api`                 |
| 도메인 개념 하나를 표현하는가? (데이터 + 그 표시)         | `entities` | `entities/parcel`(택배), `entities/user`         |
| 사용자의 **행동** 하나인가? (동사)                        | `features` | `features/receive-parcel`, `features/auth-login` |
| 여러 entity/feature를 조합한 독립 블록인가?               | `widgets`  | `widgets/parcel-list`, `widgets/header`          |
| 하나의 화면인가?                                          | `pages`    | `pages/home`, `pages/parcel-detail`              |
| 앱 전역 초기화·Provider·라우팅인가?                       | `app`      | `app/providers`, `app/routes`                    |

애매하면 낮은 계층에서 시작한다. 올리기는 쉽고 내리기는 어렵다.
슬라이스 이름은 kebab-case. entities는 명사(`parcel`), features는 동사-목적어(`receive-parcel`).

## 2. 스캐폴딩

```bash
bash .claude/skills/fsd-slice/scripts/scaffold.sh <client|admin> <layer> <slice> [segment...]
# 예) bash .claude/skills/fsd-slice/scripts/scaffold.sh client entities parcel ui model api
# 예) bash .claude/skills/fsd-slice/scripts/scaffold.sh client pages parcel-detail --route parcel/[id]
```

- 필요한 세그먼트만 만든다 (`ui` 컴포넌트, `model` 상태·훅·로직, `api` 슬라이스 전용 요청, `lib` 헬퍼, `config` 상수).
- `index.ts`(public API)를 함께 만들고, 외부에 노출할 것만 export한다. 내부 헬퍼는 export하지 않는다.
- 계층 폴더의 `.gitkeep`은 첫 슬라이스가 생기면 스크립트가 지운다.
- `pages`에 `--route`를 주면 `src/app/routes/<route>.tsx`에 re-export 한 줄을 만든다. 라우트 폴더에는 이 외의 코드를 두지 않는다.

## 3. 세그먼트 내부 규칙

- 파일명 kebab-case, 컴포넌트명 PascalCase: `ui/parcel-card.tsx` → `export function ParcelCard`.
- default export는 라우트 파일에서만 쓴다. 나머지는 named export.
- 슬라이스 내부 import는 상대 경로, 외부 슬라이스는 `@/<layer>/<slice>` (index 경유).
- 페이지는 조합만 한다. 페이지 안에서 `useQuery`를 직접 부르기보다 entity/feature가 노출한 훅을 쓴다.
- 같은 계층의 다른 슬라이스가 필요해지면 → 공통 부분을 아래로 내리거나, 위 계층(widgets/pages)에서 둘을 조합한다.

## 4. 상태 배치

| 상태 종류                            | 도구                              | 위치                                                                   |
| ------------------------------------ | --------------------------------- | ---------------------------------------------------------------------- |
| 서버 데이터                          | TanStack Query (`api-layer` 스킬) | `@taekbae/api` 훅 → entity `api`/`model`                               |
| 컴포넌트 로컬 UI 상태                | `useState`                        | 해당 컴포넌트                                                          |
| 폼 상태                              | react-hook-form + zod             | feature `model` (→ `references/forms.md`)                              |
| 여러 화면이 공유하는 클라이언트 상태 | zustand                           | 소유 슬라이스 `model/` (예: `entities/session/model/session-store.ts`) |

서버 데이터를 zustand에 복사하지 않는다 — 캐시가 두 곳이 되어 불일치가 생긴다.
토큰 등 민감 값은 zustand persist/AsyncStorage가 아닌 `expo-secure-store`.

## 5. 폼

폼을 만들 때는 `references/forms.md`를 읽는다.

## 6. 마무리 체크

- `bash .claude/skills/fsd-review/scripts/check-fsd-imports.sh <만든 파일들>` → 위반 0
- `pnpm --filter @taekbae/<app> typecheck`
