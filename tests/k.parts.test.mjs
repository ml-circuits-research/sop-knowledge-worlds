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
  assert.deepEqual(worlds.find((w) => w.id === 'k.parts').shards.map((s) => `${s.id.split('/').pop()}.sop`).filter((f) => /^[a-z]\.sop$/.test(f)), Object.keys(files));
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

// Q30 (reviewer, 2026-11-13 21:55): the plain word next to WordNet's name, and model-labelled usual parts.
import { usualShards, readUsual } from '../tools/parts-core.mjs';

test('Q30: a car has a "car door" and, as the plain word, a door; plain words are single words not already among the parts', () => {
  const car = wholes.find((w) => one(w, 'name') === 'car');
  assert.ok(car.attrs.has.map(tok).includes('car door') && car.attrs.plain.includes('door') && car.attrs.plain.includes('engine'));
  assert.ok(inherited.find((w) => one(w, 'name') === 'car' && one(w, 'from') === 'motor vehicle').attrs.plain.includes('wheel'));
  for (const w of [...wholes, ...inherited]) for (const p of w.attrs.plain ?? []) {
    assert.ok(/^[a-z-]+$/.test(p) && !w.attrs.has.map(tok).includes(p), `${w.id}: ${p}`);
    assert.ok(w.attrs.has.map(tok).some((h) => h.toLowerCase().endsWith(` ${p}`)), `${w.id}: ${p} is the last word of no part`);
  }
});

test('Q30: the usual parts are the table, model-labelled, in plain words; the audit names rows read', () => {
  for (const [name, text] of Object.entries(usualShards())) assert.equal(readFileSync(join(WORLDS_DIR, 'k.parts', 'shards', name), 'utf8'), text, name);
  const usual = world.ofType('k.parts.usual');
  assert.equal(usual.length, readUsual().length);
  assert.ok(usual.length >= 400);
  for (const u of usual) {
    assert.equal(one(u, 'named'), 'model', u.id);
    assert.deepEqual(u.attrs['core.source'], ['"hand-core 1"'], u.id);
    assert.ok(u.attrs.has.length >= 1 && !u.attrs.has.map(tok).includes(one(u, 'name')), u.id);
    assert.equal(new Set(u.attrs.has).size, u.attrs.has.length, u.id);
  }
  const by = new Map(usual.map((u) => [one(u, 'name'), u.attrs.has.map(tok)]));
  assert.ok(by.get('dog').includes('tail') && by.get('house').includes('roof') && by.get('kettle').includes('spout'));
  const audit = readFileSync(join(REPO, 'sources/hand-core/usual-parts-audit.tsv'), 'utf8').split('\n').filter(Boolean).slice(1).map((l) => l.split('\t'));
  assert.equal(audit.length, 120);
  for (const [name, verdict] of audit) assert.equal(by.has(name), verdict === 'right', name);
});
