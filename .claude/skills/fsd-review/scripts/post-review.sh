#!/usr/bin/env bash
# PR 에 인라인 코멘트가 포함된 리뷰를 한 번에 게시한다.
# usage: post-review.sh <pr-number> <review-json-file>
#   json: { "event": "COMMENT", "body": "...", "comments": [{ "path", "line", "side", "body" }] }
set -euo pipefail

pr="${1:?pr number required}"
json="${2:?review json required}"
repo="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
commit="$(gh pr view "$pr" --json headRefOid -q .headRefOid)"

# commit_id 를 head 로 고정해야 line 번호가 최신 diff 기준으로 해석된다.
payload="$(node -e '
  const fs = require("fs");
  const r = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
  r.commit_id = process.argv[2];
  r.event = r.event || "COMMENT";
  process.stdout.write(JSON.stringify(r));
' "$json" "$commit")"

printf '%s' "$payload" | gh api --method POST "repos/$repo/pulls/$pr/reviews" --input - -q .html_url
