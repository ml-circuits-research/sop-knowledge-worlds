// k.animals (Round 9 item 2): the table of animals, its shards, the size classes, the drawings, the audit.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, WORLDS_DIR, scanWorlds, fullWorld } from '../tools/lib/worlds.mjs';
import { readAnimals, animalShards, SIZES } from '../tools/animals-core.mjs';
import { sample } from '../tools/ask-sample.mjs';

const worlds = scanWorlds();
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const one = (w, k) => tok(w.attrs[k]?.[0]);
const animals = fullWorld('k.animals', worlds).ofType('k.animals.animal');

test('the shards are what tools/animals-core.mjs gives; 300 animals, each with class, size and the label named=model', () => {
  for (const [name, text] of Object.entries(animalShards())) assert.equal(readFileSync(join(WORLDS_DIR, 'k.animals', 'shards', name), 'utf8'), text, name);
  assert.ok(animals.length >= 300, `${animals.length} animals`);
  for (const a of animals) {
    assert.ok(SIZES.includes(one(a, 'size')), a.id);
    assert.deepEqual(a.attrs.named, ['model'], a.id);
    assert.deepEqual(a.attrs['core.source'], ['"hand-core 1"'], a.id);
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

test('a drawing is a k.objects object; where it has the name of the animal, the size class is that of k.scenes.thing', () => {
  const objects = new Set();
  for (const s of worlds.find((w) => w.id === 'k.objects').shards) for (const m of s.text.matchAll(/ k\.objects\.object name=("[^"]*"|\S+)/g)) objects.add(tok(m[1]));
  const sizes = new Map(fullWorld('k.scenes', worlds).ofType('k.scenes.thing').map((w) => [one(w, 'name'), one(w, 'size')]));
  let same = 0;
  for (const a of animals) {
    const d = one(a, 'drawing');
    if (!d) continue;
    assert.ok(objects.has(d), `${a.id}: no object ${d}`);
    if (d === one(a, 'name') && sizes.get(d)) { assert.equal(one(a, 'size'), sizes.get(d), `${a.id}: k.scenes says ${sizes.get(d)}`); same++; }
  }
  assert.ok(same >= 100, `${same} sizes compared`);
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
