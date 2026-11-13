import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildCatalog, serialize } from '../tools/build-catalog.mjs';
import { scanWorlds, WORLDS_DIR } from '../tools/lib/worlds.mjs';

const built = buildCatalog();

test('the catalog builds without errors', () => {
  assert.deepEqual(built.errors, []);
});

test('index.json and vocab.json on disk are what a build gives (a rerun gives no diff)', () => {
  assert.equal(readFileSync(join(WORLDS_DIR, 'index.json'), 'utf8'), serialize(built.index));
  assert.equal(readFileSync(join(WORLDS_DIR, 'vocab.json'), 'utf8'), serialize(built.vocab));
  assert.equal(readFileSync(join(WORLDS_DIR, 'LICENSES.md'), 'utf8'), built.licenses);
  assert.equal(serialize(buildCatalog().index), serialize(built.index));
});

test('every shard listed exists and every shard file is listed', () => {
  const index = JSON.parse(readFileSync(join(WORLDS_DIR, 'index.json'), 'utf8'));
  const listed = new Set();
  for (const w of index.worlds) {
    assert.ok(existsSync(join(WORLDS_DIR, w.schema)), w.schema);
    for (const s of w.shards) {
      assert.ok(existsSync(join(WORLDS_DIR, s.path)), s.path);
      assert.ok(s.license, `${s.id} has a license`);
      assert.ok(s.sources.length, `${s.id} has sources`);
      listed.add(s.id);
    }
  }
  for (const w of scanWorlds()) for (const s of w.shards) assert.ok(listed.has(s.id), `${s.id} is listed`);
});

test('LICENSES.md names every source and license of the catalog', () => {
  for (const w of built.index.worlds) {
    for (const src of w.sources) assert.ok(built.licenses.includes(`## ${src}\n`), src);
    for (const l of w.licenses) assert.ok(built.licenses.includes(l), l);
  }
});

test('every vocab entry points to listed shards or to a schema', () => {
  const index = JSON.parse(readFileSync(join(WORLDS_DIR, 'index.json'), 'utf8'));
  const vocab = JSON.parse(readFileSync(join(WORLDS_DIR, 'vocab.json'), 'utf8'));
  const ids = new Set(index.worlds.flatMap((w) => [w.schema, ...w.shards.map((s) => s.id)]));
  for (const [word, shards] of Object.entries(vocab)) {
    assert.equal(word, word.toLowerCase());
    assert.ok(shards.length > 0, word);
    for (const s of shards) assert.ok(ids.has(s), `${word} -> ${s}`);
  }
});

test('a fixture world gives keys, sources, license and vocabulary from words and identity values', () => {
  const root = mkdtempSync(join(tmpdir(), 'skw-'));
  const put = (p, t) => { mkdirSync(join(root, p, '..'), { recursive: true }); writeFileSync(join(root, p), t); };
  put('k.toy/schema.sop', '@k.toy core.module name=k.toy version=1 exports=item\n'
    + '@k.toy.item.name core.slot of=k.toy.item key=name id=true kind=atom\n'
    + '@k.toy.word.item core.word text=item text=items means=k.toy.item\n');
  put('k.toy/shards/a.sop', '# sources: test 1\n# license: CC-BY-NC-4.0\n# script: none\n'
    + '@k.toy.cup k.toy.item name=Cup core.source="test 1"\n'
    + '@k.toy.word.cup core.word text=mug means=Cup of=k.toy.item.name core.source="test 1"\n');
  try {
    const { errors, index, vocab } = buildCatalog(root);
    assert.deepEqual(errors, []);
    const [w] = index.worlds;
    assert.equal(w.version, '1');
    assert.deepEqual(w.exports, ['k.toy.item']);
    assert.deepEqual(w.shards[0].keys, ['cup']);
    assert.deepEqual(w.shards[0].sources, ['test-1']);
    assert.equal(w.shards[0].nc, true);
    assert.deepEqual(vocab, { cup: ['k.toy/shards/a'], item: ['k.toy/schema.sop'], items: ['k.toy/schema.sop'], mug: ['k.toy/shards/a'] });
    assert.match(index.version, /^[0-9a-f]{12}$/);
  } finally { rmSync(root, { recursive: true }); }
});
