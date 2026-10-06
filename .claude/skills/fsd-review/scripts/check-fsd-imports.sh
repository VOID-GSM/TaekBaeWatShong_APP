#!/usr/bin/env bash
# FSD 의존 방향 / 슬라이스 간 import / deep import 를 기계적으로 찾는다.
# usage: check-fsd-imports.sh [file...]   (인자 없으면 apps/*/src 전체)
# 출력: <file>:<line>: <규칙> | <import 문>
set -uo pipefail

rank() {
  case "$1" in
    app) echo 6 ;; pages) echo 5 ;; widgets) echo 4 ;;
    features) echo 3 ;; entities) echo 2 ;; shared) echo 1 ;; *) echo 0 ;;
  esac
}

if [[ $# -eq 0 ]]; then
  mapfile -t files < <(find apps/*/src -type f \( -name '*.ts' -o -name '*.tsx' \) 2>/dev/null)
else
  files=("$@")
fi

found=0
for f in "${files[@]}"; do
  [[ -f "$f" ]] || continue
  [[ "$f" =~ ^apps/[^/]+/src/([a-z]+)/([^/]+)? ]] || continue
  src_layer="${BASH_REMATCH[1]}"
  src_slice="${BASH_REMATCH[2]:-}"
  src_rank="$(rank "$src_layer")"
  [[ "$src_rank" -eq 0 ]] && continue

  while IFS= read -r hit; do
    lineno="${hit%%:*}"
    stmt="${hit#*:}"
    [[ "$stmt" =~ [\'\"]@/([a-z]+)(/([^/\'\"]+))?(/[^\'\"]+)?[\'\"] ]] || continue
    dst_layer="${BASH_REMATCH[1]}"
    dst_slice="${BASH_REMATCH[3]:-}"
    deep="${BASH_REMATCH[4]:-}"
    dst_rank="$(rank "$dst_layer")"
    [[ "$dst_rank" -eq 0 ]] && continue

    if (( dst_rank > src_rank )); then
      echo "$f:$lineno: [필수] 상위 계층 import ($src_layer → $dst_layer) | $stmt"; found=1
    elif (( dst_rank == src_rank )) && [[ "$src_layer" != shared && "$src_layer" != app ]]; then
      if [[ "$dst_slice" != "$src_slice" ]]; then
        echo "$f:$lineno: [필수] 같은 계층 슬라이스 간 import ($src_layer/$src_slice → $dst_layer/$dst_slice) | $stmt"; found=1
      else
        echo "$f:$lineno: [권장] 같은 슬라이스 내부는 상대 경로 사용 | $stmt"; found=1
      fi
    elif [[ -n "$deep" && "$dst_layer" != shared && "$dst_layer" != app ]]; then
      echo "$f:$lineno: [권장] public API(index.ts) 우회 deep import | $stmt"; found=1
    fi
  done < <(grep -nE "(from|import\()[[:space:]]*['\"]@/" "$f" 2>/dev/null)

  # Expo Router 라우트 루트에 라우트가 아닌 코드가 있는지 (라우트는 default export 필수)
  if [[ "$f" =~ /src/app/routes/ ]] && ! grep -qE 'export (default|\{[^}]*as default)' "$f"; then
    echo "$f:1: [필수] routes/ 안에 default export 없는 파일 — 의도치 않은 라우트가 됩니다"; found=1
  fi
done

[[ $found -eq 0 ]] && echo "FSD import 위반 없음"
exit 0
