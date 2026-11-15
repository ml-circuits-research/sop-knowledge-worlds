#!/bin/bash
# Rebase the current branch on origin/main while other workers push to it (block "Reviewer 2026-11-15 15:35").
#   tools/sync.sh            git pull --rebase origin main, then `npm run regenerate` on the rebased tip.
# Merge rules (.gitattributes, written by tools/generated.mjs):
#   - a generated file (merge=regenerate) never conflicts: the driver keeps main's side and the regeneration below
#     rewrites it from the rebased sources;
#   - the append-only logs (merge=union) keep both sides;
#   - every other file is hand-written: on a conflict this script NEVER chooses a side. It stops with the list of the
#     conflicted files and exit code 1, the rebase left in progress: resolve by hand (`git add`, `git rebase --continue`)
#     or `git rebase --abort`, then run it again.
# After the rebase the regenerated files go into the last commit if the branch has commits of its own (else they are
# left in the working tree). Each step waits for free memory (SKW_MIN_FREE_MB, default 3000); the regeneration is
# retried when killed.
#   SKW_REMOTE (default origin), SKW_BRANCH (default main): what to rebase on (the tests use a toy remote).
cd "$(dirname "$0")/.." || exit 1
MIN=${SKW_MIN_FREE_MB:-3000}
REMOTE=${SKW_REMOTE:-origin}
BRANCH=${SKW_BRANCH:-main}
LOG=$(mktemp -t skw-sync.XXXX)
git config merge.regenerate.name "a generated file: keep main's side; tools/sync.sh regenerates it"
git config merge.regenerate.driver true
git config core.hooksPath tools/hooks # tools/hooks/pre-push refuses a push with stale generated files
in_rebase() { [ -d "$(git rev-parse --git-path rebase-merge)" ] || [ -d "$(git rev-parse --git-path rebase-apply)" ]; }
is_generated() { [ "$(git check-attr merge -- "$1" | sed 's/.*: merge: //')" = regenerate ]; }
stop_on_conflicts() { # every conflict left after the merge rules: generated ones take main's side, the rest stop us
  local hand=()
  for f in $(git diff --name-only --diff-filter=U); do
    if is_generated "$f"; then git checkout --ours -- "$f" 2>/dev/null || git rm -q -- "$f"; git add -- "$f"; else hand+=("$f"); fi
  done
  if [ ${#hand[@]} -gt 0 ]; then
    echo "sync.sh: conflict in hand-written files; no side was chosen. Resolve them by hand, then git rebase --continue:"
    printf '  %s\n' "${hand[@]}"
    exit 1
  fi
}
if ! git pull --rebase "$REMOTE" "$BRANCH" >> "$LOG" 2>&1; then in_rebase || { echo "sync.sh: git pull failed (a dirty tree?), see $LOG"; exit 1; }; fi
while in_rebase; do
  stop_on_conflicts
  GIT_EDITOR=true git rebase --continue >> "$LOG" 2>&1 || { in_rebase || { echo "sync.sh: the rebase failed, see $LOG"; exit 1; }; }
done
for i in 1 2 3 4; do # the regeneration as package.json says it, retried when killed
  until [ "$(awk '/MemAvailable/{print int($2/1024)}' /proc/meminfo)" -gt "$MIN" ]; do sleep 5; done
  npm run --silent regenerate >> "$LOG" 2>&1 && break
  [ "$i" = 4 ] && { echo "sync.sh: npm run regenerate failed, see $LOG"; exit 1; }
done
if [ -n "$(git status --porcelain)" ] && [ "$(git rev-list --count "$REMOTE/$BRANCH"..HEAD)" -gt 0 ]; then
  git add -A && git commit -q --amend --no-edit
fi
git log --oneline -3
git status --short | head -5
