// tools/test-run.mjs: which test files a change touches (npm run test:changed), by names and imports.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { plan, allTests, verdict, runFiles } from '../tools/test-run.mjs';

const files = (paths) => [...plan(paths).keys()];
const ALWAYS = ['tests/catalog.test.mjs', 'tests/validate.test.mjs', 'tests/repo.test.mjs'];

test('a change touches its own tests, the tests that import the changed module, and the always-run three', () => {
  for (const t of ALWAYS) assert.ok(allTests().includes(t), t);
  assert.deepEqual(files(['worker-log.md', 'docs/worlds/index.json']).sort(), [...ALWAYS].sort(), 'logs and generated files touch nothing more');
  assert.ok(files(['tests/k.geo.test.mjs']).includes('tests/k.geo.test.mjs'));
  // a module: the tests importing it, directly or through another module
  const choose = files(['tools/lib/choose.mjs']);
  assert.ok(choose.includes('tests/k.compose.test.mjs'));
  assert.ok(!choose.includes('tests/k.geo.test.mjs'));
  assert.ok(files(['tools/lib/worlds.mjs']).length >= allTests().length - 5, 'the shared loader touches nearly every test');
});

test('a world touches the tests named after it or naming it, its questions (only its own), and the worlds importing it', () => {
  const p = plan(['docs/worlds/k.geo/shards/cities-a.sop']);
  assert.ok(p.has('tests/k.geo.test.mjs') && p.has('tests/questions.test.mjs'));
  assert.deepEqual([...p.scope.get('tests/questions.test.mjs')], ['k.geo']);
  assert.ok(!p.has('tests/w.lang.ro.test.mjs'));
  assert.ok(p.has('tests/coverage-report.test.mjs'), 'a page computed from every world');
  // a questions file alone runs the questions of its world
  const q = plan(['tests/k.animals.questions.jsonl']);
  assert.deepEqual([...q.scope.get('tests/questions.test.mjs')], ['k.animals']);
  // a shard written by a tool: the tool's change touches that world's tests
  assert.ok(files(['tools/wearables-core.mjs']).includes('tests/k.wearables.test.mjs'));
});

// review 2026-11-15, finding 1: tests/derived.test.mjs was killed (SIGKILL) on all five tries and logged `ok`, 0 pass
test('a file killed on every try, or one that ran no test, fails as "not run"; a file that ran and passed is ok', async () => {
  assert.equal(verdict({ killed: true, signal: 'SIGKILL', code: null, tests: 0, fail: 0, tries: 5 }), 'not run (killed by SIGKILL on all 5 tries)');
  assert.equal(verdict({ killed: false, signal: null, code: 0, tests: 0, fail: 0 }), 'not run (0 tests)');
  assert.equal(verdict({ killed: false, signal: null, code: 1, tests: 3, fail: 1 }), '1 failing');
  assert.equal(verdict({ killed: false, signal: null, code: 0, tests: 3, fail: 0 }), null);
  const dir = mkdtempSync(join(tmpdir(), 'skw-runner-'));
  try {
    const f = (name, body) => { const p = join(dir, name); writeFileSync(p, `import { test } from 'node:test';\n${body}\n`); return p; };
    const killed = f('killed.test.mjs', "process.kill(process.pid, 'SIGKILL');");
    const empty = f('empty.test.mjs', '');
    const good = f('good.test.mjs', "test('one', () => {});");
    const lines = [];
    const ok = await runFiles([killed, empty, good], { log: (l) => lines.push(l), tries: 2, keep: false, pause: 0 });
    assert.equal(ok, false);
    const byFile = Object.fromEntries(runFiles.results.map((r) => [r.file, r]));
    assert.match(byFile[killed].why, /^not run \(killed by SIGKILL on all 2 tries\)/);
    assert.equal(byFile[killed].tries, 2);
    assert.equal(byFile[empty].why, 'not run (0 tests)');
    assert.equal(byFile[good].why, null);
    assert.ok(lines.some((l) => l.startsWith('FAIL') && l.includes(killed)) && lines.some((l) => l.startsWith('ok') && l.includes(good)));
    assert.match(lines.at(-1), /failing files 2 \(not run: /);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
