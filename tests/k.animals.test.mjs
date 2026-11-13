// k.animals (Round 9 item 2): the table of animals, its shards, the size classes, the drawings, the audit.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, WORLDS_DIR, scanWorlds, fullWorld } from '../tools/lib/worlds.mjs';
import { readAnimals, animalShards, animalThings, usualPlace, SIZES } from '../tools/animals-core.mjs';
import { parse } from '../tools/sopworld/sopworld.mjs';
import { handSources } from '../tools/lib/worlds.mjs';
import { sample } from '../tools/ask-sample.mjs';

const worlds = scanWorlds();
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const one = (w, k) => tok(w.attrs[k]?.[0]);
const animals = fullWorld('k.animals', worlds).ofType('k.animals.animal');

test('the shards are what tools/animals-core.mjs gives; 300 animals, each with class and the label named=model; none says a size (Q32)', () => {
  for (const [name, text] of Object.entries(animalShards())) assert.equal(readFileSync(join(WORLDS_DIR, 'k.animals', 'shards', name), 'utf8'), text, name);
  assert.ok(animals.length >= 300, `${animals.length} animals`);
  for (const a of animals) {
    assert.equal(a.attrs.size, undefined, a.id);
    assert.deepEqual(a.attrs.named, ['model'], a.id);
    assert.ok(handSources(a.attrs['core.source']), a.id);
    assert.ok(a.attrs.habitat?.length || one(a, 'name') === 'flea', `${a.id}: where it lives`);
  }
  const count = (k) => animals.filter((a) => a.attrs[k]?.length).length;
  assert.ok(count('legs') >= 270 && count('covering') >= 230 && count('eats') >= 280 && count('baby') >= 230 && count('group') >= 100 && count('sound') >= 110, JSON.stringify(Object.fromEntries(['legs', 'covering', 'eats', 'baby', 'group', 'sound'].map((k) => [k, count(k)]))));
});

test('what cannot fly: every animal that is not a bird or an insect, unless it is said to fly; no verb in both can and cannot', () => {
  for (const a of animals) {
    const can = (a.attrs.can ?? []).map(tok), cannot = (a.attrs.cannot ?? []).map(tok);
    for (const v of can) assert.ok(!cannot.includes(v), `${a.id}: ${v}`);
    if (!['bird', 'insect'].includes(one(a, 'class'))) assert.ok(can.includes('fly') !== cannot.includes('fly'), `${a.id}: fly`);
  }
  const fliers = animals.filter((a) => !['bird', 'insect'].includes(one(a, 'class')) && (a.attrs.can ?? []).includes('fly')).map((a) => one(a, 'name'));
  assert.deepEqual(fliers, ['bat']);
});

test('Q32, one home: every animal has its size class in exactly one k.scenes.thing, the size of the table of animals', () => {
  const things = new Map(fullWorld('k.scenes', worlds).ofType('k.scenes.thing').map((w) => [one(w, 'name'), w]));
  const table = new Map(readAnimals().map((a) => [a.name, a]));
  let other = 0;
  for (const a of animals) {
    const name = one(a, 'name'), at = one(a, 'thing') ?? name;
    if (at !== name) { other++; assert.ok(things.has(name), `${name}: thing= is only for a name that another thing has`); if (one(a, 'drawing') !== at) assert.notEqual(one(things.get(name), 'size'), table.get(name).size, name); }
    assert.ok(things.has(at), `${name}: no k.scenes.thing ${at}`);
    assert.equal(one(things.get(at), 'size'), table.get(name).size, name);
    assert.ok(SIZES.includes(one(things.get(at), 'size')), name);
  }
  assert.deepEqual([...animalThings().thingOf].sort(), [['crane', 'crane bird'], ['kiwi', 'kiwi bird'], ['tuna', 'tuna fish']]);
  assert.equal(other, 3);
  // The place of a row made for an animal, by the rule.
  assert.equal(one(things.get('cod'), 'place'), 'water');
  assert.equal(one(things.get('sparrow'), 'place'), 'sky');
  assert.equal(one(things.get('jaguar'), 'place'), 'ground');
  assert.equal(things.get('bumblebee').attrs.place, undefined);
  assert.equal(usualPlace({ class: 'mammal', habitat: ['sea', 'ice'], can: [], cannot: ['fly'] }), 'water');
});

test('Q32, one home: no world but k.scenes declares a size class or a usual place of a named thing', () => {
  // The size class (tiny to huge) and the usual place (sky, ground, water, indoors, on_thing) are the enums of
  // k.scenes.thing. Another slot with the key `size` or `place` whose enum is one of those is the same fact in a
  // second home. k.space.body.size is not: it is a planet's class among the planets (small to huge, no tiny).
  const classes = (w, key) => parse(w.schemaText).filter((s) => s.type === 'core.slot' && s.attrs.key?.[0] === key && s.attrs.enum);
  const home = worlds.find((w) => w.id === 'k.scenes');
  for (const key of ['size', 'place']) {
    const own = classes(home, key).find((s) => s.attrs.of[0] === 'k.scenes.thing').attrs.enum.join(' ');
    for (const w of worlds) for (const s of classes(w, key)) if (s.attrs.of[0] !== 'k.scenes.thing') assert.notEqual(s.attrs.enum.join(' '), own, `${s.id} repeats k.scenes.thing.${key}`);
  }
});

test('a drawing is a k.objects object', () => {
  const objects = new Set();
  for (const s of worlds.find((w) => w.id === 'k.objects').shards) for (const m of s.text.matchAll(/ k\.objects\.object name=("[^"]*"|\S+)/g)) objects.add(tok(m[1]));
  for (const a of animals) {
    const d = one(a, 'drawing');
    if (!d) continue;
    assert.ok(objects.has(d), `${a.id}: no object ${d}`);
  }
});

test('the audit: 200 rows of the table, each with a verdict; a wrong or unclear one has a note', () => {
  const names = new Set(readAnimals().map((a) => a.name));
  const rows = readFileSync(join(REPO, 'sources/hand-core/animals-audit.tsv'), 'utf8').split('\n').filter((l) => l.trim() && !l.startsWith('#')).map((l) => l.split('\t'));
  assert.equal(rows.length, 200);
  assert.equal(new Set(rows.map((r) => r[1])).size, 200);
  for (const [, name, verdict, note] of rows) { assert.ok(names.has(name), name); assert.ok(['right', 'wrong', 'unclear'].includes(verdict), name); if (verdict !== 'right') assert.ok(note, name); }
});

test('natural questions (Round 9 item 8): of the seeded sample of 100 about animals, at least 80 find a fact', () => {
  const r = sample('animals');
  assert.equal(r.asked, 100);
  assert.ok(r.found >= 80, `${r.found} of 100`);
});
