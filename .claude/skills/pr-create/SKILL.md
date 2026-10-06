---
name: pr-create
description: Git Flow 규칙에 맞춰 작업 브랜치를 만들고 PR을 생성한다. 제목은 `[feat] 메인 화면 작업` 형식, 본문은 .github/PULL_REQUEST_TEMPLATE.md 기준, base는 develop(hotfix·release는 main). "PR 만들어줘", "PR 올려줘", "풀리퀘", "pull request", "브랜치 따줘", "브랜치 만들어줘", "작업 브랜치", "PR 본문 써줘", "PR 제목 수정", "PR 업데이트" 요청 시 반드시 이 스킬을 사용할 것.
---

# PR Create

## Git Flow 브랜치 규칙

| 브랜치      | 역할                                        | 분기 원본 | PR base   |
| ----------- | ------------------------------------------- | --------- | --------- |
| `main`      | 라이브 출시 브랜치 (Git Flow의 master 역할) | -         | -         |
| `develop`   | 다음 출시 버전 개발                         | main      | main      |
| `<type>/*`  | 기능·수정 작업 (feat, fix, refactor 등)     | develop   | `develop` |
| `release/*` | 출시 준비 (예: `release/1.0.0`)             | develop   | `main`    |
| `hotfix/*`  | main의 버그 긴급 수정                       | main      | `main`    |

- 작업 브랜치명: `<type>/<kebab-case-영문-요약>` — 예: `feat/mypage`, `fix/login-token`, `design/parcel-card`
- `<type>`은 커밋 type과 같은 집합(feat/fix/refactor/style/design/docs/test/chore)을 쓴다.
- 현재 브랜치가 `develop`/`main`이고 변경이 있으면 먼저 작업 브랜치를 만든다:
  ```bash
  git switch develop && git pull --ff-only origin develop   # 로컬 변경이 없을 때만
  git switch -c feat/mypage
  ```
  (로컬 변경이 있으면 pull 없이 `git switch -c`로 변경을 그대로 가져간다.)

## PR 생성 절차

1. **사전 확인**
   - `git status` — 커밋되지 않은 변경이 있으면 `commit-message` 스킬로 먼저 커밋한다.
   - base 결정: 브랜치가 `hotfix/` 또는 `release/`면 `main`, 그 외는 `develop`.
   - `git log --oneline origin/<base>..HEAD`와 `git diff origin/<base>...HEAD --stat`로 PR에 들어갈 내용을 파악한다.
   - 이미 열린 PR이 있는지 `gh pr view --json number,url,title 2>/dev/null`로 확인한다. 있으면 새로 만들지 않고 `gh pr edit`으로 제목/본문을 갱신한다.
2. **푸시**: `git push -u origin <branch>`
3. **제목**: `[<type>] <작업 요약>`
   - type은 브랜치 prefix를 따른다. hotfix 브랜치는 `[hotfix]`, release는 `[release]`.
   - 요약은 커밋들을 아우르는 한 줄 한글. 예: `[feat] 메인 화면 작업`, `[fix] 로그인 토큰 갱신 오류 수정`, `[chore] 개발 하네스 구성`
4. **본문**: 아래 템플릿을 그대로 채운다. 섹션 제목과 이모지는 바꾸지 않는다 — 팀이 템플릿으로 PR을 훑기 때문이다. 안내 문구(`> 개요를 작성해 주세요.`)는 실제 내용으로 교체한다.
   ```markdown
   ## ❓ 개요

   > 이 PR이 왜 필요한지 1~3줄

   ## #️⃣ 연관된 이슈

   > close #12 (없으면 "없음")

   ## 📝 작업 내용

   - 커밋 단위로 무엇을 했는지 (커밋 메시지를 사람이 읽기 좋게 풀어서)

   ## 📄 리뷰 요청사항

   > 설계 판단이 갈리는 부분, 확신이 없는 부분, 테스트가 부족한 부분

   ## 📸 스크린샷/영상(선택)

   UI 변경이 없으면 "없음"
   ```
   - 연관 이슈: 브랜치명·커밋에 이슈 번호가 있거나 사용자가 알려주면 `close #N`. 모르면 사용자에게 묻지 말고 "없음"으로 두고 최종 보고에 언급한다.
   - UI 변경(design/feat 화면)이 있는데 스크린샷이 없으면 "추후 첨부" 로 남기고 사용자에게 알린다.
5. **생성**: 본문은 이스케이프 문제를 피하려고 파일로 넘긴다. 스크래치 경로를 쓴다.
   ```bash
   bash .claude/skills/pr-create/scripts/create-pr.sh "<title>" <body-file> [base]
   ```
   스크립트는 base를 브랜치명으로 자동 결정하고(인자로 덮어쓰기 가능), 이미 PR이 있으면 edit한다.
6. 생성된 PR URL을 보고한다.

## 하지 않는 것

- `develop`이 아닌 곳으로 기능 PR 생성 (hotfix·release 제외)
- 사용자 확인 없이 merge
- draft 여부는 사용자가 말할 때만 `--draft`
