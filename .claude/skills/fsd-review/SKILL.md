---
name: fsd-review
description: 택배왔슝 레포 전용 코드 리뷰. FSD 계층 의존 방향, 슬라이스 public API, Expo Router 라우트 루트, React Native/TanStack Query/TypeScript 규칙을 기준으로 PR 또는 로컬 diff를 리뷰하고, 필요하면 GitHub PR에 인라인 코멘트로 게시한다. "코드 리뷰해줘", "PR 리뷰", "리뷰 남겨줘", "#12 리뷰", "변경사항 검토", "FSD 규칙 맞는지 봐줘", "리뷰 코멘트 달아줘", "다시 리뷰" 요청 시 반드시 이 스킬을 사용할 것. 리뷰에 달린 코멘트에 답하는 작업은 review-reply 스킬이 담당한다.
---

# FSD Review

## 리뷰 대상 결정

- PR 번호/URL이 주어짐 → `gh pr view <n> --json number,title,body,baseRefName,headRefName,files` + `gh pr diff <n>`
- 없으면 현재 브랜치의 PR(`gh pr view`)을, 그것도 없으면 `git diff origin/develop...HEAD` + 작업 트리 변경을 리뷰한다.
- diff만 보지 말고, 변경 파일이 import하는 대상과 같은 슬라이스의 `index.ts`도 읽는다. FSD 위반은 diff 한 줄만 봐서는 판단이 안 되는 경우가 많다.

## 검사 순서

1. **자동 검사 먼저**: 변경된 패키지에 대해 `pnpm turbo run lint typecheck test --filter=...[origin/develop]`를 돌린다. 실패 항목은 그대로 리뷰 코멘트의 근거가 된다. 오래 걸리거나 환경 문제로 실패하면 그 사실을 리뷰에 적고 계속한다.
2. **프로젝트 체크리스트**: `references/checklist.md`를 읽고 항목별로 확인한다. FSD 의존 방향 위반은 `scripts/check-fsd-imports.sh`로 기계적으로 먼저 찾는다:
   ```bash
   bash .claude/skills/fsd-review/scripts/check-fsd-imports.sh $(git diff --name-only origin/develop...HEAD)
   ```
3. **정확성**: 실제로 깨지는 시나리오가 있는 버그를 우선한다 (null 처리, 비동기 race, 쿼리 키 불일치, 언마운트 후 setState, 플랫폼 분기 누락 등).

## 코멘트 작성 원칙

- 각 코멘트에 심각도 접두어를 붙인다. 작성자가 무엇부터 고칠지 바로 알 수 있게 하기 위함이다.
  - `[필수]` 머지 전 반드시 수정 — 버그, FSD 의존 역전, 보안(비밀값 노출 등)
  - `[권장]` 고치면 좋음 — 구조·가독성·성능
  - `[질문]` 의도 확인
  - `[칭찬]` 좋은 판단은 짧게 언급 (남발하지 않음)
- "왜 문제인지 + 어떻게 고치면 되는지"를 함께 쓴다. 가능하면 GitHub suggestion 블록을 쓴다:
  ````markdown
  [권장] 슬라이스 외부에서는 public API로만 가져와야 내부 구조 변경에 안전합니다.

  ```suggestion
  import { ParcelCard } from '@/entities/parcel';
  ```
  ````
- 한국어, 존댓말, 간결하게. 같은 지적이 여러 곳이면 첫 위치에만 달고 "같은 패턴: a.ts, b.ts"로 묶는다.
- 확신 없는 추측은 `[질문]`으로 단다. 근거 없는 `[필수]`는 신뢰를 깎는다.

## 게시

로컬 리뷰만 요청받았으면 결과를 대화로 보고한다. PR에 게시하라고 했거나 오케스트레이터에서 게시 단계로 호출됐으면 인라인 코멘트로 올린다:

1. 아래 형식의 JSON을 스크래치 경로에 작성한다. `line`은 PR diff의 **새 파일 기준 줄 번호**(RIGHT side)이며 diff 범위 안이어야 한다 — 범위 밖이면 GitHub이 422를 반환하므로 그 코멘트는 본문(`body`)으로 옮긴다.
   ```json
   {
     "event": "COMMENT",
     "body": "## 리뷰 요약\n- [필수] 1건, [권장] 2건\n- lint/typecheck 통과",
     "comments": [
       {
         "path": "apps/client/src/features/x/ui/a.tsx",
         "line": 12,
         "side": "RIGHT",
         "body": "[필수] ..."
       }
     ]
   }
   ```
2. `bash .claude/skills/fsd-review/scripts/post-review.sh <pr-number> <json-file>`
3. `event`: 본인 PR에는 APPROVE/REQUEST_CHANGES를 쓸 수 없으므로 기본은 `COMMENT`. 사용자가 승인/변경요청을 명시했고 타인 PR일 때만 바꾼다.

## 출력 (오케스트레이터 연동 시)

`_workspace/review_<pr>.md`에 요약(심각도별 개수, 코멘트 목록, 자동 검사 결과)을 남긴다. review-responder가 이 파일을 참고한다.
