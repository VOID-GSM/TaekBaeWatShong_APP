#!/usr/bin/env bash
# PR 리뷰 스레드 조회 / 답글 / resolve 헬퍼.
#   threads.sh list <pr> [--all]           미해결 스레드 JSON (--all: resolve 된 것 포함)
#   threads.sh reply <pr> <commentId> <body-file>
#   threads.sh resolve <threadId>
set -euo pipefail

cmd="${1:?usage: threads.sh list|reply|resolve ...}"
shift

repo="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
owner="${repo%%/*}"
name="${repo##*/}"

case "$cmd" in
  list)
    pr="${1:?pr number required}"
    all="${2:-}"
    gh api graphql -F owner="$owner" -F name="$name" -F pr="$pr" -f query='
      query($owner: String!, $name: String!, $pr: Int!) {
        repository(owner: $owner, name: $name) {
          pullRequest(number: $pr) {
            reviewThreads(first: 100) {
              nodes {
                id isResolved isOutdated path line
                comments(first: 50) {
                  nodes { databaseId author { login } body createdAt }
                }
              }
            }
          }
        }
      }' | SHOW_ALL="$all" node -e '
        let s = ""; process.stdin.on("data", d => s += d).on("end", () => {
          const all = process.env.SHOW_ALL === "--all";
          const threads = JSON.parse(s).data.repository.pullRequest.reviewThreads.nodes
            .filter(t => all || !t.isResolved)
            .map(t => ({
              threadId: t.id, isResolved: t.isResolved, isOutdated: t.isOutdated,
              path: t.path, line: t.line,
              comments: t.comments.nodes.map(c => ({
                id: c.databaseId, author: c.author && c.author.login, body: c.body, createdAt: c.createdAt,
              })),
            }));
          process.stdout.write(JSON.stringify(threads, null, 2) + "\n");
        });
      '
    ;;
  reply)
    pr="${1:?pr number required}"
    comment_id="${2:?comment id required}"
    body_file="${3:?body file required}"
    gh api --method POST "repos/$repo/pulls/$pr/comments/$comment_id/replies" \
      -F body=@"$body_file" -q .html_url
    ;;
  resolve)
    thread_id="${1:?thread id required}"
    gh api graphql -f id="$thread_id" -f query='
      mutation($id: ID!) { resolveReviewThread(input: { threadId: $id }) { thread { id isResolved } } }' \
      -q .data.resolveReviewThread.thread.isResolved
    ;;
  *)
    echo "unknown command: $cmd" >&2
    exit 1
    ;;
esac
