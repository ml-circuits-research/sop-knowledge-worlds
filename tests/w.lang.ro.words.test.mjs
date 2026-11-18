// The Romanian word of each kind of the published world schemas (the library's Q79, reviewer 2026-11-15 16:45): shards
// w.lang.ro/shards/words-<schema>; every kind named also has an English word in its schema; a word that is a lemma of the
// hand dictionary has its gender and plural from its class (masă -> mese); none of them is in the English vocab.json.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR, scanWorlds, fullWorld } from '../tools/lib/worlds.mjs';
import { parse, morphOf, generate } from '../tools/sopworld/sopworld.mjs';
import { TYPES, dictionaryRows } from '../tools/lang-ro-core.mjs';

const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const one = (w, k) => tok(w.attrs[k]?.[0]);
const dir = join(WORLDS_DIR, 'w.lang.ro', 'shards');
const files = readdirSync(dir).filter((f) => /^words-w\./.test(f));
const SCHEMAS = ['w.calendar', 'w.chart', 'w.diagram', 'w.document', 'w.face', 'w.list', 'w.map', 'w.person', 'w.seating', 'w.tasks', 'w.timeline'];

test('every published world schema has a Romanian words shard; its kinds there have an English word in the owned vocabulary', () => {
  assert.deepEqual(files.map((f) => f.slice(6, -4)).sort(), SCHEMAS);
  for (const s of SCHEMAS) {
    const schema = parse(readFileSync(join(WORLDS_DIR, s, 'schema.sop'), 'utf8'));
    const types = new Set(schema.filter((w) => w.type === 'core.type').map((w) => w.attrs.of[0]));
    const enWords = new Set(parse(readFileSync(join(WORLDS_DIR, s, 'shards/words.sop'), 'utf8')).filter((w) => w.type === 'core.word').map((w) => one(w, 'means')));
    const ro = parse(readFileSync(join(dir, `words-${s}.sop`), 'utf8')).filter((w) => w.type === 'core.word');
    assert.ok(ro.some((w) => one(w, 'means') === s && one(w, 'of') === 'std.schema.world.name'), `${s}: a word for the world`);
    for (const w of ro.filter((x) => one(x, 'means') !== s)) {
      assert.ok(types.has(one(w, 'means')), `${w.id}: ${one(w, 'means')} is a kind of ${s}`);
      assert.ok(enWords.has(one(w, 'means')), `${one(w, 'means')}: an English word in the schema`);
    }
    // the kinds that are not parts of a face all have a word
    if (s !== 'w.face') for (const t of types) assert.ok(ro.some((w) => one(w, 'means') === t), `${t}: no Romanian word`);
  }
});

test('the words are lemmas of the hand dictionary (but nod and diapozitiv: no sense of k.words to join yet), their plurals by class', () => {
  const m = morphOf(fullWorld('w.lang.ro', scanWorlds()), { types: TYPES });
  const rows = new Map(dictionaryRows().map((r) => [r[0], r]));
  const words = files.flatMap((f) => parse(readFileSync(join(dir, f), 'utf8'))).filter((w) => w.type === 'core.word' && !one(w, 'of')).map((w) => one(w, 'text'));
  const missing = [...new Set(words)].filter((x) => !rows.has(x));
  assert.deepEqual(missing.sort(), ['diapozitiv', 'nod']);
  const pl = (x) => generate(m, x, rows.get(x)[1], { num: 'pl', case: 'nomacc', def: 'no' });
  assert.deepEqual(['masă', 'loc', 'invitat', 'articol', 'sarcină', 'față', 'secțiune'].map(pl), ['mese', 'locuri', 'invitați', 'articole', 'sarcini', 'fețe', 'secțiuni']);
  const vocab = JSON.parse(readFileSync(join(WORLDS_DIR, 'vocab.json'), 'utf8'));
  for (const x of ['masă', 'sarcină', 'invitat']) assert.ok(!vocab[x], `${x} in the English vocab`);
});
