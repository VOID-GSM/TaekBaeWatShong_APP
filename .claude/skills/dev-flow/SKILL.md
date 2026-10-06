---
name: dev-flow
description: 택배왔슝 개발 워크플로우 오케스트레이터 — 브랜치 생성, 기능 단위 커밋, PR 생성, 코드 리뷰, 리뷰 코멘트 반영·답글·resolve를 Git Flow 규칙에 맞게 묶어서 실행한다. "작업 올려줘", "커밋하고 PR까지", "PR 만들고 리뷰까지", "리뷰 반영하고 다시 올려줘", "개발 플로우 돌려줘", "작업 마무리", "머지 준비", "PR 다시 실행", "리뷰만 다시", "이전 PR 업데이트", "결과 개선" 등 커밋·PR·리뷰가 두 단계 이상 걸친 요청에 반드시 사용할 것. 커밋만, PR만, 리뷰만, 답글만 요청하면 각각 commit-message / pr-create / fsd-review / review-reply 스킬을 직접 사용한다.
---

# Dev Flow (오케스트레이터)

**실행 모드: 서브 에이전트 (파이프라인)**
커밋 → PR → 리뷰 → 반영은 순차 의존이고 각 단계의 결과(PR 번호, 리뷰 요약)만 다음 단계로 넘기면 된다. 팀원 간 실시간 토론이 필요 없으므로 팀 통신 오버헤드 대신 서브 에이전트를 순차 호출한다. 모든 Agent 호출은 `model: "opus"`.

| 에이전트           | 정의                                 | 스킬                         |
| ------------------ | ------------------------------------ | ---------------------------- |
| `pr-author`        | `.claude/agents/pr-author.md`        | commit-message, pr-create    |
| `code-reviewer`    | `.claude/agents/code-reviewer.md`    | fsd-review                   |
| `review-responder` | `.claude/agents/review-responder.md` | review-reply, commit-message |

에이전트 호출 시 prompt에 "먼저 `.claude/agents/<name>.md`를 읽고 그 역할과 스킬을 따르라"를 포함하고, `subagent_type: "general-purpose"`를 쓴다 (git/gh 실행과 파일 수정이 필요하므로 읽기 전용 타입 불가).

## Phase 0: 컨텍스트 확인

1. `git status --short`, `git rev-parse --abbrev-ref HEAD`, `gh pr view --json number,url,state,reviewDecision 2>/dev/null`
2. `_workspace/` 확인 (레포 루트, gitignore됨)
3. 실행 분기:
   | 상황                              | 시작 Phase                 |
   | --------------------------------- | -------------------------- |
   | 변경 있음, PR 없음                | Phase 1 (초기 실행)        |
   | PR 있음 + 새 변경 있음            | Phase 1 (PR 갱신)          |
   | PR 있음 + 미해결 리뷰 스레드 있음 | Phase 3 (반영)             |
   | PR 있음 + 사용자가 "리뷰"를 요청  | Phase 2                    |
   | 사용자가 특정 단계만 "다시" 요청  | 해당 Phase만 (부분 재실행) |
4. `_workspace/` 파일은 PR 번호로 구분되므로 다른 PR 작업을 시작해도 지우지 않는다.

## Phase 1: 커밋 & PR — `pr-author`

```
Agent(subagent_type="general-purpose", model="opus", description="커밋 및 PR 생성",
      prompt="먼저 .claude/agents/pr-author.md 를 읽어라. <작업 요약/이슈 번호/draft 여부>.
              결과를 _workspace/pr_<번호>.md 에 기록하고 PR 번호와 URL을 반환하라.")
```

- 반환된 PR 번호를 이후 Phase에 전달한다.

## Phase 2: 리뷰 — `code-reviewer`

사용자가 리뷰를 원할 때만 실행한다 ("커밋하고 PR까지"에는 포함하지 않음).

```
Agent(subagent_type="general-purpose", model="opus", description="PR 코드 리뷰",
      prompt="먼저 .claude/agents/code-reviewer.md 를 읽어라. PR #<n> 을 리뷰하고 <게시 여부>.
              요약을 _workspace/review_<n>.md 에 기록하라.")
```

## Phase 3: 리뷰 반영 — `review-responder`

```
Agent(subagent_type="general-purpose", model="opus", description="리뷰 코멘트 반영",
      prompt="먼저 .claude/agents/review-responder.md 를 읽어라. PR #<n> 의 미해결 스레드를 처리하라.
              '사용자 판단' 항목은 처리하지 말고 목록으로 반환하라. 결과를 _workspace/reply_<n>.md 에 기록하라.")
```

- "사용자 판단" 항목이 반환되면 메인이 사용자에게 묻고, 답을 받아 같은 에이전트를 SendMessage로 이어서 호출한다.
- 기본은 분류표를 사용자에게 먼저 보여주고 진행한다. 사용자가 "알아서 반영해"라고 했으면 자동 진행.

## 데이터 전달

- 반환값: PR 번호, URL, 남은 스레드 수 (메인이 다음 Phase로 전달)
- 파일: `_workspace/pr_<n>.md`, `_workspace/review_<n>.md`, `_workspace/reply_<n>.md` — 재실행·감사용으로 보존

## 에러 핸들링

- 에이전트 실패 시 1회 재시도. 재실패하면 멈추고 어느 단계에서 무엇이 실패했는지 보고한다 (커밋·PR은 부분 성공 상태로 다음 Phase에 넘어가면 위험하다).
- `gh` 미인증: `! gh auth login` 안내 후 중단.
- 사용자가 요청하지 않은 merge는 하지 않는다.

## 최종 보고

- 브랜치, 커밋 목록, PR URL, 리뷰 요약(심각도별 개수), 처리된/남은 스레드
- 피드백 요청: "커밋 분할이나 리뷰 기준, 답글 톤에서 바꾸고 싶은 점이 있나요?" — 피드백은 해당 스킬에 반영하고 CLAUDE.md 변경 이력에 기록한다.

## 테스트 시나리오

**정상 흐름**: develop에서 `apps/client/src/shared/api/` axios 설정 + `entities/parcel` 추가 후 "커밋하고 PR 올려줘"
→ Phase 0: 변경 있음·PR 없음 → Phase 1: `feat/parcel-api` 브랜치, 커밋 `feat: axios 기본 설정`, `feat: 택배 엔티티 추가`, PR `[feat] 택배 API 연동 기초 작업` (base develop) → URL 보고.

**리뷰 반영 흐름**: "#3 리뷰 반영해줘" → Phase 0: 미해결 스레드 3개 → Phase 3: 반영 2(커밋 후 해시 답글·resolve), 미반영 1(이유 답글·resolve) → 남은 스레드 0 보고.

**에러 흐름**: commit-msg 훅이 `Feat: ...`를 거부 → pr-author가 `feat: ...`로 재커밋. `gh` 401 → 인증 안내 후 Phase 1 중단, 로컬 커밋은 유지됨을 보고.
