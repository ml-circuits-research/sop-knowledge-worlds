// The repository itself: no merge conflict markers in any tracked text file (a rebase that kept both sides of a log
// once left them in worker-log.md).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { REPO } from '../tools/lib/worlds.mjs';

test('no tracked text file holds a merge conflict marker', () => {
  let out = '';
  try {
    out = execFileSync('git', ['grep', '-n', '-I', '-E', '^(<<<<<<< |>>>>>>> |=======$)', ], { cwd: REPO, encoding: 'utf8' });
  } catch (e) { if (e.status !== 1) throw e; } // status 1: nothing found
  assert.equal(out, '');
});
