// k.parts (Round 8, item 5): usual parts of common things from WordNet part meronyms.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, WORLDS_DIR, scanWorlds, fullWorld } from '../tools/lib/worlds.mjs';

const worlds = scanWorlds();
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const one = (w, k) => tok(w.attrs[k]?.[0]);
const world = fullWorld('k.parts', worlds);
const wholes = world.ofType('k.parts.whole'), inherited = world.ofType('k.parts.inherited');
const raw = existsSync(join(REPO, 'sources/wordnet/raw/wordnet31/data.noun')) && existsSync(join(REPO, 'sources/frequency-words/raw/en_50k.txt'));

test('the shards are what tools/import/parts.mjs gives (when the raw files are there)', { skip: !raw }, async () => {
  const { runParts } = await import('../tools/import/parts.mjs');
  const { files } = runParts();
  const dir = join(WORLDS_DIR, 'k.parts', 'shards');
  assert.deepEqual(worlds.find((w) => w.id === 'k.parts').shards.map((s) => `${s.id.split('/').pop()}.sop`), Object.keys(files));
  for (const [name, text] of Object.entries(files)) assert.equal(readFileSync(join(dir, name), 'utf8'), text, name);
});

test('every fact is from WordNet, names parts, and no thing is its own part; refused kinds are not there', () => {
  assert.ok(wholes.length >= 300 && inherited.length >= 350);
  for (const w of [...wholes, ...inherited]) {
    assert.deepEqual(w.attrs['core.source'], ['"wordnet 3.1"'], w.id);
    assert.ok(w.attrs.has.length >= 1 && !w.attrs.has.map(tok).includes(one(w, 'name')), w.id);
  }
  for (const w of wholes) assert.ok(one(w, 'gloss').length > 5, w.id);
  const refused = readFileSync(join(REPO, 'sources/coverage/not-parts.tsv'), 'utf8').split('\n').filter((l) => l.trim() && !l.startsWith('#')).map((l) => l.split('\t'));
  for (const w of inherited) {
    assert.ok(['1', '2'].includes(w.attrs.steps[0]), w.id);
    for (const [thing, kind, part] of refused) {
      if ((thing === '*' || thing === one(w, 'name')) && kind === one(w, 'from')) assert.ok(part !== '*' && !w.attrs.has.map(tok).includes(part), `${w.id}: refused in not-parts.tsv`);
    }
  }
});

test('a car has a car door, an engine and (as a motor vehicle) a car wheel; a bicycle a pedal and (as a wheeled vehicle) a wheel', () => {
  const own = (n) => wholes.find((w) => one(w, 'name') === n).attrs.has.map(tok);
  const from = (n, kind) => inherited.find((w) => one(w, 'name') === n && one(w, 'from') === kind).attrs.has.map(tok);
  assert.ok(own('car').includes('car door') && own('car').includes('automobile engine'));
  assert.ok(from('car', 'motor vehicle').includes('car wheel'));
  assert.ok(own('bicycle').includes('pedal') && from('bicycle', 'wheeled vehicle').includes('wheel'));
  assert.ok(own('tree').includes('trunk') && own('bird').includes('wing') && own('chair').includes('leg'));
});

test('things reach their shard through the vocabulary index', () => {
  const vocab = JSON.parse(readFileSync(join(WORLDS_DIR, 'vocab.json'), 'utf8'));
  for (const [word, shard] of [['car', 'c'], ['tree', 't'], ['knife', 'k']]) assert.ok(vocab[word]?.includes(`k.parts/shards/${shard}`), word);
});
