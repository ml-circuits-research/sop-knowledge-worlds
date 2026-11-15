// KR5 (review 2026-11-15, finding 26): every generator owns its files and a test reruns it. These had none (tools/objects-hand.mjs and its table are gone: its 7 shards are hand-written, tests/k.objects.hand.test.mjs):
// tools/lang-en-core.mjs (w.lang.en core-plurals, from WordNet's noun
// exception list, now committed in sources/wordnet/exc so the test runs in every clone) and tools/lang-en-discourse.mjs
// (w.lang.en templates-discourse).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR, REPO, scanWorlds } from '../tools/lib/worlds.mjs';
import { pluralsShard } from '../tools/lang-en-core.mjs';
import { shard as discourseShard } from '../tools/lang-en-discourse.mjs';

const onDisk = (p) => readFileSync(join(WORLDS_DIR, p), 'utf8');

test('tools/lang-en-core.mjs: core-plurals is what it gives from the committed noun.exc and k.words', () => {
  const text = pluralsShard(readFileSync(join(REPO, 'sources/wordnet/exc/noun.exc'), 'utf8'), scanWorlds());
  assert.equal(onDisk('w.lang.en/shards/core-plurals.sop'), text, 'run node tools/lang-en-core.mjs (npm run build does)');
  assert.match(text, /singular=mouse plural=mice/);
});

test('tools/lang-en-discourse.mjs: templates-discourse is what it gives', () => {
  assert.equal(onDisk('w.lang.en/shards/templates-discourse.sop'), discourseShard(), 'run node tools/lang-en-discourse.mjs');
});
