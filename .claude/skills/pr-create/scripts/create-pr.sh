#!/usr/bin/env bash
# PR 생성/갱신 헬퍼.
# usage: create-pr.sh "<title>" <body-file> [base]
#   base 생략 시: hotfix/*, release/* → main, 그 외 → develop
set -euo pipefail

title="${1:?title required}"
body_file="${2:?body file required}"
branch="$(git rev-parse --abbrev-ref HEAD)"

case "$branch" in
  develop|main)
    echo "error: '$branch' 에서는 PR 을 만들 수 없습니다. 작업 브랜치를 먼저 만드세요." >&2
    exit 1
    ;;
esac

if [[ -n "${3:-}" ]]; then
  base="$3"
else
  case "$branch" in
    hotfix/*|release/*) base="main" ;;
    *) base="develop" ;;
  esac
fi

if ! [[ "$title" =~ ^\[[a-z]+\]\ .+ ]]; then
  echo "error: 제목은 '[type] 요약' 형식이어야 합니다: $title" >&2
  exit 1
fi

git push -u origin "$branch"

if existing="$(gh pr view "$branch" --json url -q .url 2>/dev/null)" && [[ -n "$existing" ]]; then
  gh pr edit "$branch" --title "$title" --body-file "$body_file" --base "$base"
  echo "updated: $existing"
else
  gh pr create --base "$base" --head "$branch" --title "$title" --body-file "$body_file"
fi
