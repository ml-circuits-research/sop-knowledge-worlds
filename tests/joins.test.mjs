// One name, one thing across worlds (Round 10, item 3): k.attributes.same and docs/worlds/JOINS.md.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR, scanWorlds, fullWorld, schemaWorld } from '../tools/lib/worlds.mjs';
import { joins, joinShards, joinsPage, JOINS_PAGE, TYPES, SENSES } from '../tools/joins.mjs';

const worlds = scanWorlds();
const j = joins(worlds);
const same = fullWorld('k.attributes', worlds).ofType('k.attributes.same');
const of = (name) => same.filter((s) => s.attrs.name[0].replace(/"/g, '') === name);

test('the shards and JOINS.md are what tools/joins.mjs gives from the shards as they are (stale after another world changed: run `npm run build`)', () => {
  const files = joinShards(j);
  assert.deepEqual(worlds.find((w) => w.id === 'k.attributes').shards.map((s) => s.id.split('/').pop()).filter((n) => n.startsWith('same-')).map((n) => `${n}.sop`), Object.keys(files));
  for (const [name, text] of Object.entries(files)) assert.equal(readFileSync(join(WORLDS_DIR, 'k.attributes', 'shards', name), 'utf8'), text, name);
  assert.equal(readFileSync(JOINS_PAGE, 'utf8'), joinsPage(j));
});

test('every type named exists with its key; a name with one fact is `only`, a name with several is not; every name is in two worlds', () => {
  const schema = new Map();
  for (const [type, key] of TYPES) {
    const w = type.split('.').slice(0, 2).join('.');
    if (!schema.has(w)) schema.set(w, schemaWorld(worlds, w).world);
    assert.ok(schema.get(w).schema(type)?.keys[key], `${type}.${key}`);
  }
  const known = new Set(TYPES.map((t) => t[0]));
  const count = new Map();
  for (const s of same) count.set(s.attrs.name[0], (count.get(s.attrs.name[0]) ?? 0) + 1);
  assert.ok(same.length >= 3000);
  for (const s of same) {
    assert.ok(SENSES.includes(s.attrs.sense[0].replace(/"/g, '')), s.id);
    assert.equal(s.attrs.only[0], String(count.get(s.attrs.name[0]) === 1), s.id);
    const types = [...s.attrs.in, ...(s.attrs.unsure ?? []), ...(s.attrs.by_word ?? [])];
    for (const t of types) assert.ok(known.has(t), `${s.id}: ${t}`);
    assert.ok(new Set(types.map((t) => t.split('.')[1])).size >= 2 || count.get(s.attrs.name[0]) > 1, s.id);
  }
});

test('duck is one thing in k.objects, k.animals, k.scenes and k.attributes; orange, crane, kiwi and turkey are clashes', () => {
  const duck = of('duck');
  assert.equal(duck.length, 1);
  assert.deepEqual(duck[0].attrs.sense, ['animal']);
  for (const t of ['k.objects.object', 'k.animals.animal', 'k.scenes.thing', 'k.attributes.drawn']) assert.ok(duck[0].attrs.in.includes(t), t);
  assert.ok(duck[0].attrs.by_word.includes('k.words.sense'));
  assert.deepEqual(of('orange').map((s) => s.attrs.sense[0]).sort(), ['colour', 'food', 'place']);
  const crane = of('crane');
  assert.ok(crane.find((s) => s.attrs.sense[0] === 'animal').attrs.in.includes('k.animals.animal') && crane.find((s) => s.attrs.sense[0] === 'thing').attrs.in.includes('k.objects.object'), 'the drawing crane is the machine');
  assert.ok(of('kiwi').find((s) => s.attrs.sense[0] === 'food').attrs.in.includes('k.objects.object'), 'the drawing kiwi is the fruit');
  assert.deepEqual(of('turkey').map((s) => s.attrs.sense[0]).sort(), ['animal', 'food', 'place']);
  for (const n of ['sun', 'apron', 'cat', 'car']) assert.equal(of(n).length, 1, n);
});
