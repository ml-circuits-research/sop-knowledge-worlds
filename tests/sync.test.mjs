// tools/sync.sh on a toy repository (block "Reviewer 2026-11-15 15:35"): it took main's side for a conflict in a
// hand-written file and went on, so a worker's change to package.json was dropped. Now a conflict in a hand-written file
// stops it with the list of files (exit 1, the rebase left in progress, nothing dropped), and a conflict only in
// generated files (merge=regenerate) goes through: main's side is kept and `npm run regenerate` rewrites them, while the
// append-only logs (merge=union) keep both sides.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, copyFileSync, rmSync, existsSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import { REPO } from '../tools/lib/worlds.mjs';

const GEN = `import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
mkdirSync('docs/worlds', { recursive: true });
const src = readdirSync('src').sort().map((f) => f + ':' + readFileSync('src/' + f, 'utf8').trim());
writeFileSync('docs/worlds/index.json', JSON.stringify(src) + '\\n');
`;

function toy() {
  const root = mkdtempSync(join(tmpdir(), 'skw-sync-'));
  const git = (cwd, ...a) => execFileSync('git', a, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  git(root, 'init', '-q', '--bare', '-b', 'main', 'origin.git');
  const seed = join(root, 'seed');
  mkdirSync(join(seed, 'tools'), { recursive: true });
  mkdirSync(join(seed, 'src'));
  copyFileSync(join(REPO, 'tools/sync.sh'), join(seed, 'tools/sync.sh'));
  writeFileSync(join(seed, 'package.json'), JSON.stringify({ name: 'toy', private: true, scripts: { regenerate: 'node gen.mjs' } }));
  writeFileSync(join(seed, 'gen.mjs'), GEN);
  writeFileSync(join(seed, '.gitattributes'), 'worker-log.md merge=union\ndocs/worlds/index.json merge=regenerate\n');
  writeFileSync(join(seed, 'README.md'), 'line one\nline two\n');
  writeFileSync(join(seed, 'worker-log.md'), '# log\n');
  writeFileSync(join(seed, 'src/a.txt'), 'a\n');
  execFileSync(process.execPath, ['gen.mjs'], { cwd: seed });
  git(root, 'init', '-q', '-b', 'main', 'seed');
  for (const [k, v] of [['user.name', 'toy'], ['user.email', 'toy@example.org']]) git(seed, 'config', k, v);
  git(seed, 'add', '-A'); git(seed, 'commit', '-q', '-m', 'seed'); git(seed, 'remote', 'add', 'origin', join(root, 'origin.git')); git(seed, 'push', '-q', 'origin', 'main');
  const clone = (name) => {
    const d = join(root, name);
    git(root, 'clone', '-q', join(root, 'origin.git'), name);
    for (const [k, v] of [['user.name', name], ['user.email', `${name}@example.org`]]) git(d, 'config', k, v);
    return d;
  };
  const commit = (d, msg) => { execFileSync(process.execPath, ['gen.mjs'], { cwd: d }); git(d, 'add', '-A'); git(d, 'commit', '-q', '-m', msg); };
  const sync = (d) => spawnSync('bash', ['tools/sync.sh'], { cwd: d, encoding: 'utf8', env: { ...process.env, SKW_MIN_FREE_MB: '0' } });
  return { root, git, clone, commit, sync };
}

test('a conflict in a hand-written file stops sync.sh with the list of files; no side is chosen and nothing is dropped', () => {
  const t = toy();
  try {
    const main = t.clone('other'), mine = t.clone('worker');
    writeFileSync(join(main, 'README.md'), 'line one\nline two (main)\n'); t.commit(main, 'main edits README'); t.git(main, 'push', '-q', 'origin', 'main');
    writeFileSync(join(mine, 'README.md'), 'line one\nline two (mine)\n'); t.commit(mine, 'worker edits README');
    const r = t.sync(mine);
    assert.equal(r.status, 1, r.stdout + r.stderr);
    assert.match(r.stdout, /conflict in hand-written files/);
    assert.match(r.stdout, /^\s+README\.md$/m);
    assert.ok(existsSync(join(mine, '.git', 'rebase-merge')) || existsSync(join(mine, '.git', 'rebase-apply')), 'the rebase is left in progress');
    const text = readFileSync(join(mine, 'README.md'), 'utf8');
    assert.match(text, /\(mine\)/); assert.match(text, /\(main\)/); // both sides still there, for the worker to resolve
  } finally { rmSync(t.root, { recursive: true, force: true }); }
});

test('a conflict only in generated files and logs goes through: generated files regenerated on the rebased tip, logs keep both sides', () => {
  const t = toy();
  try {
    const main = t.clone('other'), mine = t.clone('worker');
    writeFileSync(join(main, 'src/b.txt'), 'b\n'); appendFileSync(join(main, 'worker-log.md'), 'main entry\n'); t.commit(main, 'main adds b'); t.git(main, 'push', '-q', 'origin', 'main');
    writeFileSync(join(mine, 'src/c.txt'), 'c\n'); appendFileSync(join(mine, 'worker-log.md'), 'worker entry\n'); t.commit(mine, 'worker adds c');
    const r = t.sync(mine);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.deepEqual(JSON.parse(readFileSync(join(mine, 'docs/worlds/index.json'), 'utf8')), ['a.txt:a', 'b.txt:b', 'c.txt:c']);
    const log = readFileSync(join(mine, 'worker-log.md'), 'utf8');
    assert.match(log, /main entry/); assert.match(log, /worker entry/);
    assert.equal(t.git(mine, 'log', '-1', '--format=%s').trim(), 'worker adds c');
    assert.equal(t.git(mine, 'status', '--porcelain').trim(), '', 'the regenerated file went into the worker\'s commit');
    assert.match(t.git(mine, 'show', '--stat', 'HEAD'), /src\/c\.txt/);
  } finally { rmSync(t.root, { recursive: true, force: true }); }
});
