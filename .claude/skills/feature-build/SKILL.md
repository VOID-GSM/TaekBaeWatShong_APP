---
name: feature-build
description: 택배왔슝 기능 개발 오케스트레이터 — 요구사항/Figma 시안을 받아 계획(FSD 슬라이스·API 계약) → UI·도메인 병렬 구현 → 경계면 QA → (선택) dev-flow로 커밋·PR까지 진행한다. "OO 기능 개발해줘", "OO 화면 만들어줘(API 연동 포함)", "이 피그마대로 기능 구현", "택배 목록/상세/수령 기능", "로그인 기능", "알림 기능 구현", "기능 다시 구현", "QA만 다시", "UI만 수정", "이전 기능 결과 보완" 요청 시 반드시 사용할 것. 컴포넌트 하나·스타일 수정·API 훅 하나처럼 단일 영역 작업은 ui-system / figma-to-rn / api-layer / fsd-slice 스킬을 직접 사용한다.
---

# Feature Build (오케스트레이터)

| 에이전트            | 정의                                  | 담당                                      |
| ------------------- | ------------------------------------- | ----------------------------------------- |
| `feature-developer` | `.claude/agents/feature-developer.md` | types/api/entities model/features         |
| `ui-developer`      | `.claude/agents/ui-developer.md`      | theme/shared ui/entities ui/widgets/pages |
| `qa-inspector`      | `.claude/agents/qa-inspector.md`      | 자동 검사 + 경계면 교차 검증              |

모든 Agent 호출: `subagent_type: "general-purpose"`, `model: "opus"`, prompt 첫 줄에 "먼저 `.claude/agents/<name>.md`를 읽어라".
산출물 경로: `_workspace/feature_<name>/` (`<name>`은 kebab-case 기능명).

## Phase 0: 컨텍스트 확인

- `_workspace/feature_<name>/` 없음 → 초기 실행 (Phase 1부터)
- 있음 + 부분 요청("UI만", "QA만 다시") → 해당 Phase만, 해당 에이전트만 재호출
- 있음 + 새 요구사항 → 기존 폴더를 `_workspace/feature_<name>_prev/`로 옮기고 새 실행
- 작업 브랜치 확인: `develop`/`main`이면 `pr-create` 스킬 규칙으로 `feat/<name>` 브랜치를 만든다.

## Phase 1: 계획 — 메인(오케스트레이터)이 직접

**실행 모드: 메인 단독** — 계획은 사용자와의 질의가 필요할 수 있어 메인이 맡는다.

1. 요구사항·Figma(있으면 `figma-to-rn` 1단계로 구조만 파악)·기존 코드를 읽는다.
2. `_workspace/feature_<name>/01_plan.md` 작성:
   - **슬라이스 목록**: 계층/슬라이스/세그먼트와 담당 에이전트 (`fsd-slice` 계층 표 기준)
   - **계약**: zod 타입명과 필드, 쿼리 키, 훅 이름·시그니처, 컴포넌트 props, 라우트 경로. 두 에이전트가 병렬로 작업해도 맞물리게 하는 유일한 근거다.
   - **API 가정**: 엔드포인트·메서드·응답 형태 (백엔드 스펙 미확정 시 "가정"으로 표시)
   - **미해결**: 사용자에게 물어야 할 것
3. 미해결 중 구현을 막는 것(예: 백엔드 응답 형태를 전혀 모름, 아이콘 방식)이 있으면 사용자에게 한 번에 묻고 계획에 반영한다. 막지 않는 것은 가정으로 진행한다.

## Phase 2: 병렬 구현

**실행 모드: 서브 에이전트 병렬 (`run_in_background: true`)** — 계약이 파일로 고정돼 있어 실시간 조율 없이 병렬 작업이 가능하다. 담당 경로가 겹치지 않게 계획에서 나눴는지 확인 후 실행.

```
Agent(feature-developer, run_in_background=true,
      prompt="... 01_plan.md 의 계약을 먼저 구현·export 하고 02_feature.md 에 기록하라.")
Agent(ui-developer, run_in_background=true,
      prompt="... 01_plan.md 의 계약에 맞춰 UI 를 구현하고 02_ui.md 에 기록하라. Figma: <url>")
```

둘 다 끝나면 각 보고서의 "계약 변경"/"미해결"을 확인한다. 계약이 바뀌었으면 01_plan.md를 갱신하고, 영향받는 쪽 에이전트를 SendMessage로 이어서 수정시킨다.

## Phase 3: QA — `qa-inspector`

**실행 모드: 서브 에이전트**

```
Agent(qa-inspector, prompt="... feature_<name> 을 검증하고 03_qa.md 에 기록하라.")
```

- `[필수]` 지적이 있으면 담당 에이전트를 SendMessage로 재호출해 수정 → QA 재실행. **최대 2회** 반복하고, 그래도 남으면 남은 항목을 사용자에게 보고한다(무한 루프 방지).
- 기능이 커서 슬라이스가 많으면(5개 이상) Phase 2를 entities/api → features → widgets/pages 순으로 나누고 각 단계 직후 QA를 범위 지정해 돌린다(점진적 QA).

## Phase 4: 마무리

- 최종 보고: 구현한 슬라이스, 계약 요약, API 가정, 디자인에 없어 임의로 정한 상태, QA 결과, 남은 이슈.
- 사용자가 커밋/PR까지 원하면 `dev-flow` 스킬로 넘긴다 (커밋은 슬라이스·기능 단위로 나뉘도록 `01_plan.md`의 슬라이스 목록을 pr-author에게 전달).
- 피드백 요청: "구현 방식이나 디자인 반영에서 바꾸고 싶은 점이 있나요?" — 반영 시 해당 스킬 수정 + CLAUDE.md 변경 이력 기록.

## 에러 핸들링

- 에이전트 실패: 1회 재시도, 재실패 시 해당 결과 없이 진행하되 보고서에 누락 명시. 단 feature-developer 실패 시 계약이 없으므로 QA로 넘어가지 않는다.
- 두 에이전트 보고가 충돌(같은 타입을 다르게 정의): 삭제하지 말고 둘 다 기록한 뒤 계획 파일 기준으로 통일 지시.
- 의존성 설치가 필요하다는 보고: 사용자 확인 후 설치.

## 테스트 시나리오

**정상 흐름**: "택배 목록 화면 만들어줘. 상태 필터(도착/수령) 있고 카드 누르면 상세로"
→ Phase 1 계획: `entities/parcel`(model/ui), `features/filter-parcel-status`, `widgets/parcel-list`, `pages/home`, `pages/parcel-detail` + 라우트 `parcel/[id]`, 계약 `Parcel`, `parcelQueries.list`, `ParcelCard({ parcel, onPress })`
→ Phase 2 병렬 → Phase 3 QA: `router.push('/parcels/1')`와 라우트 `parcel/[id]` 불일치 발견 → ui-developer 수정 → 재QA 통과 → 보고.

**에러 흐름**: 백엔드 스펙 없음 + Figma 미인증 → 계획에 API 가정 명시, ui-developer는 토큰 기반 구현 후 "디자인 미대조" 표시 → 보고서에 두 항목을 후속 확인 필요로 남김.
