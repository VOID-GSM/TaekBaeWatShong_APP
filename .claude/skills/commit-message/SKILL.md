---
name: commit-message
description: 택배왔슝 레포의 커밋 메시지 작성 및 커밋 분할 규칙. 변경 사항을 작은 기능 단위로 나눠 `feat: axios 기본 설정` 같은 `type: 한글 요약` 한 줄 메시지로 커밋한다. "커밋해줘", "커밋 메시지 써줘", "변경사항 커밋", "나눠서 커밋", "커밋 정리", "staged 커밋", "작업 저장해줘(git)" 등 git commit이 일어나는 모든 상황에서 반드시 이 스킬을 따를 것. 커밋 메시지 수정(amend 제외 새 커밋) 요청에도 사용.
---

# Commit Message

이 레포의 커밋은 리뷰어와 미래의 팀원이 `git log --oneline`만 보고도 "무엇이 바뀌었는지" 알 수 있어야 한다. 그래서 **커밋 하나 = 작은 기능 하나**, 메시지는 그 기능을 짧게 드러내는 한 줄이다.

## 메시지 형식

```
<type>: <무엇을 했는지 한글 요약>
```

| type     | 언제                                                     |
| -------- | -------------------------------------------------------- |
| feat     | 새로운 기능 추가                                         |
| fix      | 버그 수정                                                |
| refactor | 기능 변경 없는 코드 리팩토링                             |
| style    | 코드 스타일 변경 (공백, 세미콜론, import 정렬 등)        |
| design   | CSS/UI 수정 (스타일시트, 레이아웃, 색상, 아이콘 등)      |
| docs     | 문서 수정 (README, 주석만 바뀐 경우, CLAUDE.md 등)       |
| test     | 테스트 코드 추가/수정                                    |
| chore    | 빌드, 설정 파일 수정 (package.json, eas.json, eslint 등) |

`.husky/commit-msg` 훅이 이 형식을 검사하므로 형식이 틀리면 커밋 자체가 실패한다.

### 요약 작성법

- 한글 명사형으로 끝낸다. 마침표 없음. 50자 이내 권장.
  - ✅ `feat: axios 기본 설정`
  - ✅ `feat: 택배 목록 조회 API 연동`
  - ✅ `fix: 로그인 토큰 만료 시 무한 재요청 수정`
  - ✅ `design: 택배 카드 그림자 및 여백 조정`
  - ✅ `chore: EAS Update 설정 추가`
  - ❌ `feat: 작업함` / `fix: 수정` — 무엇을 했는지 안 보임
  - ❌ `feat: axios 설정하고 로그인 화면 만들고 토큰 저장` — 커밋을 나눠야 한다는 신호
  - ❌ `Feat: ...`, `feat : ...`, `feat(api): ...` — 훅이 거부함 (scope 미사용)
- "무엇을"이 드러나는 구체 명사를 넣는다 (라이브러리명, 화면명, 도메인명, FSD 슬라이스명).
- 본문(body)은 기본적으로 쓰지 않는다. 왜 그렇게 했는지가 코드만으로 드러나지 않을 때만 빈 줄 뒤에 짧게 덧붙인다.

## 커밋 분할 절차

1. `git status --short`, `git diff`, `git diff --staged`로 전체 변경을 파악한다.
2. 변경을 **기능 단위 그룹**으로 묶는다. 기준: "이 그룹만 리버트해도 의미가 통하는가?"
   - 의존 설치(`package.json` + `pnpm-lock.yaml`)와 그걸 쓰는 설정 코드는 같은 기능이면 한 커밋 (`feat: axios 기본 설정`)
   - FSD 슬라이스별로 나누는 것이 대개 자연스럽다 (`entities/parcel` → `features/receive-parcel` → `pages/home`)
   - 포맷만 바뀐 파일은 별도 `style:` 커밋으로 분리한다 — 리뷰 diff가 깨끗해진다
   - 한 파일에 서로 다른 기능이 섞여 있으면 `git add -p`는 대화형이라 쓸 수 없으므로, 그대로 한 커밋으로 묶되 메시지는 주된 기능 기준으로 쓴다
3. 의존 순서대로 커밋한다 (하위 계층 → 상위 계층, shared → entities → features → widgets → pages → app). 각 커밋 시점에 코드가 최대한 깨지지 않게 하기 위함이다.
4. 그룹마다 경로를 명시해서 스테이징한다. `git add -A` / `git add .`는 의도치 않은 파일(.env 등)을 넣을 수 있으므로 쓰지 않는다.
   ```bash
   git add apps/client/src/shared/api/
   git commit -m "feat: axios 기본 설정"
   ```
5. pre-commit 훅(lint-staged: prettier)이 파일을 고칠 수 있다. 훅이 실패하면 원인을 고치고 **새로** 커밋한다. `--no-verify`로 우회하지 않는다.
6. 끝나면 `git log --oneline -n <커밋수>`로 결과를 보여준다.

## 하지 않는 것

- 사용자가 요청하지 않은 push
- 이미 push된 커밋의 amend / rebase
- `develop`, `main`에 직접 커밋 — 작업 브랜치가 아니면 먼저 `pr-create` 스킬의 브랜치 규칙대로 분기한다
- 커밋 메시지에 Co-Authored-By 등 시스템이 요구하는 트레일러는 시스템 지침을 따른다 (형식 검사는 첫 줄만 본다)
