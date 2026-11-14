import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildCatalog, serialize, serializeCompact } from '../tools/build-catalog.mjs';
import { scanWorlds, WORLDS_DIR } from '../tools/lib/worlds.mjs';

// buildCatalog validates every world first (tools/validate.mjs: every schema and shard loads with zero errors, alone
// and with the other shards of its world) and returns its errors: the first test is the validation of the catalog.
const built = buildCatalog();

test('the catalog builds without errors', () => {
  assert.deepEqual(built.errors, []);
});

test('index.json and vocab.json on disk are what a build gives (a rerun gives no diff)', () => {
  assert.equal(readFileSync(join(WORLDS_DIR, 'index.json'), 'utf8'), serialize(built.index));
  assert.equal(readFileSync(join(WORLDS_DIR, 'vocab.json'), 'utf8'), serialize(built.vocab));
  assert.equal(readFileSync(join(WORLDS_DIR, 'LICENSES.md'), 'utf8'), built.licenses);
  assert.equal(readFileSync(join(WORLDS_DIR, 'vocab-kinds.json'), 'utf8'), serializeCompact(built.vocabKinds));
  // (the files on disk are an earlier build's output: equal to this build, a rerun gives no diff; a second build here
  // took 45 s and checked nothing more)
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
  const ids = new Set([...index.worlds.flatMap((w) => [w.schema, ...w.shards.map((s) => s.id)]), ...(index.schemas ?? []).map((s) => s.schema)]);
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

test('block 07:40 item 3: vocab-kinds.json says what each word names, with the same shards as vocab.json', () => {
  const vocab = JSON.parse(readFileSync(join(WORLDS_DIR, 'vocab.json'), 'utf8'));
  const kinds = JSON.parse(readFileSync(join(WORLDS_DIR, 'vocab-kinds.json'), 'utf8'));
  for (const [word, byKind] of Object.entries(kinds)) for (const shards of Object.values(byKind)) for (const s of shards) assert.ok(vocab[word].includes(s), `${word}: ${s}`);
  const covered = Object.keys(vocab).filter((w) => kinds[w]).length;
  assert.equal(covered, Object.keys(vocab).length, 'every word has a kind');
  // "back" is a river of k.geo (a reader that cannot resolve rivers skips it), and a part of the body
  assert.ok(kinds.back['k.geo.river'] && kinds.back['k.body.part']);
  assert.deepEqual(kinds.peking['k.geo.city'], ['k.geo/shards/aliases']);
  assert.deepEqual(kinds.capital['k.geo.country.capital'], ['k.geo/schema.sop']);
  assert.ok(kinds['seating plan']['w.seating']);
});

test('block 07:40 item 4: a typical thing of a shape or a colour leads to the fact ("what shape is a stop sign")', () => {
  const kinds = JSON.parse(readFileSync(join(WORLDS_DIR, 'vocab-kinds.json'), 'utf8'));
  assert.deepEqual(kinds['stop sign']['k.shapes.shape.thing'], ['k.shapes/shards/shapes']);
  assert.ok(kinds.banana['k.colours.colour.thing']);
});
