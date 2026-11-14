// tools/test-run.mjs: which test files a change touches (npm run test:changed), by names and imports.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { plan, allTests } from '../tools/test-run.mjs';

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
  // a questions file alone runs the questions of its world
  const q = plan(['tests/k.animals.questions.jsonl']);
  assert.deepEqual([...q.scope.get('tests/questions.test.mjs')], ['k.animals']);
  // a shard written by a tool: the tool's change touches that world's tests
  assert.ok(files(['tools/wearables-core.mjs']).includes('tests/k.wearables.test.mjs'));
});
