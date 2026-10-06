#!/usr/bin/env bash
# FSD 슬라이스 스캐폴딩.
# usage: scaffold.sh <client|admin> <layer> <slice> [segment...] [--route <route-path>]
#   segment: ui model api lib config (기본: ui)
#   --route: pages 계층 전용. src/app/routes/<route-path>.tsx 에 re-export 파일 생성
set -euo pipefail

app="${1:?app (client|admin) required}"
layer="${2:?layer required}"
slice="${3:?slice required}"
shift 3

case "$app" in client|admin) ;; *) echo "error: app 은 client|admin" >&2; exit 1 ;; esac
case "$layer" in pages|widgets|features|entities) ;; *)
  echo "error: layer 는 pages|widgets|features|entities (shared/app 은 슬라이스가 없음)" >&2; exit 1 ;;
esac
if ! [[ "$slice" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
  echo "error: slice 이름은 kebab-case: $slice" >&2; exit 1
fi

segments=()
route=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --route) route="${2:?route path required}"; shift 2 ;;
    ui|model|api|lib|config) segments+=("$1"); shift ;;
    *) echo "error: 알 수 없는 segment: $1" >&2; exit 1 ;;
  esac
done
[[ ${#segments[@]} -eq 0 ]] && segments=(ui)

src="apps/$app/src"
dir="$src/$layer/$slice"
if [[ -e "$dir" ]]; then
  echo "error: 이미 존재: $dir" >&2; exit 1
fi

# kebab → PascalCase
pascal="$(echo "$slice" | sed -E 's/(^|-)([a-z0-9])/\U\2/g')"

for seg in "${segments[@]}"; do
  mkdir -p "$dir/$seg"
done

if [[ "$layer" == pages ]]; then
  mkdir -p "$dir/ui"
  cat > "$dir/ui/${slice}-page.tsx" <<EOF
import { StyleSheet, Text, View } from 'react-native';

export function ${pascal}Page() {
  return (
    <View style={styles.container}>
      <Text>${pascal}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
EOF
  echo "export { ${pascal}Page } from './ui/${slice}-page';" > "$dir/index.ts"
else
  echo "// ${layer}/${slice} public API — 슬라이스 밖에 노출할 것만 export 한다." > "$dir/index.ts"
  echo "export {};" >> "$dir/index.ts"
fi

rm -f "$src/$layer/.gitkeep"

if [[ -n "$route" ]]; then
  [[ "$layer" == pages ]] || { echo "error: --route 는 pages 계층에서만" >&2; exit 1; }
  route_file="$src/app/routes/${route}.tsx"
  if [[ -e "$route_file" ]]; then
    echo "warn: 라우트 파일이 이미 있어 건너뜀: $route_file" >&2
  else
    mkdir -p "$(dirname "$route_file")"
    echo "export { ${pascal}Page as default } from '@/pages/${slice}';" > "$route_file"
    echo "created $route_file"
  fi
fi

find "$dir" -type f -o -type d -empty | sed 's/^/created /'
