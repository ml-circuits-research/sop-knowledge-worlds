#!/bin/bash
# Rebase the current branch on origin/main while other workers push to it.
#   tools/sync.sh            git pull --rebase origin main; on a conflict: the logs and pages (*.md) keep both sides,
#                            other files keep main's side (ours, during a rebase), the generated files are regenerated
#                            (measures, key words, narration, then `npm run build`); then the rebase continues.
# A conflict that the union leaves with markers stops the script (tests/repo.test.mjs also refuses markers).
# Each build step waits for free memory (SKW_MIN_FREE_MB, default 3000) and is retried when killed.
cd "$(dirname "$0")/.." || exit 1
MIN=${SKW_MIN_FREE_MB:-3000}
LOG=$(mktemp -t skw-sync.XXXX)
step() { # run one node tool, waiting for memory, retried up to 6 times
  for i in 1 2 3 4 5 6; do
    until [ "$(awk '/MemAvailable/{print int($2/1024)}' /proc/meminfo)" -gt "$MIN" ]; do sleep 5; done
    node "tools/$1.mjs" >> "$LOG" 2>&1 && return 0
    sleep 5
  done
  echo "step $1 failed, see $LOG"; return 1
}
git pull --rebase origin main >> "$LOG" 2>&1
while [ -d .git/rebase-merge ] || [ -d .git/rebase-apply ]; do
  python3 - <<'PY' || exit 1
import subprocess, sys
files = subprocess.run(['git', 'diff', '--name-only', '--diff-filter=U'], capture_output=True, text=True).stdout.split()
left = []
for p in files:
    if not p.endswith('.md'):
        subprocess.run(['git', 'checkout', '--ours', p]); continue
    out, side, a, b = [], None, [], []
    for line in open(p).read().split('\n'):
        if line.startswith('<<<<<<< ') and side is None: side, a, b = 'a', [], []; continue
        if line == '=======' and side == 'a': side = 'b'; continue
        if line.startswith('>>>>>>> ') and side == 'b':
            out += a + ([''] if a and a[-1] != '' else []) + b; side = None; continue
        (a if side == 'a' else b if side == 'b' else out).append(line)
    text = '\n'.join(out)
    if side is not None or any(l.startswith(('<<<<<<< ', '>>>>>>> ')) for l in out): left.append(p)
    open(p, 'w').write(text)
if left: print('markers left in', left); sys.exit(1)
PY
  for s in measures-core key-words narration-core; do step "$s" || exit 1; done
  for i in 1 2 3 4; do # the build as package.json says it, retried when killed
    until [ "$(awk '/MemAvailable/{print int($2/1024)}' /proc/meminfo)" -gt "$MIN" ]; do sleep 5; done
    npm run --silent build >> "$LOG" 2>&1 && break
    [ "$i" = 4 ] && { echo "build failed, see $LOG"; exit 1; }
  done
  git add -A
  GIT_EDITOR=true git rebase --continue >> "$LOG" 2>&1
done
git log --oneline -3
git status --short | head -5
