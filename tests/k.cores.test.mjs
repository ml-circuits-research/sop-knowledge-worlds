// The four hand-written cores of Round 3 (k.space, k.animals, k.body, k.food): their sizes, their joins to k.objects by
// name (`drawing`), and that the names they refer to inside a world exist there.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scanWorlds, fullWorld } from '../tools/lib/worlds.mjs';
import { handSources } from '../tools/lib/worlds.mjs';

const worlds = scanWorlds();
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const all = (world, type) => fullWorld(world, worlds).ofType(type);
const names = (wires) => new Set(wires.map((w) => tok(w.attrs.name[0])));
const objects = names(all('k.objects', 'k.objects.object'));
const CORES = [['k.space', 'k.space.body'], ['k.space', 'k.space.kind'], ['k.animals', 'k.animals.animal'], ['k.body', 'k.body.part'], ['k.food', 'k.food.food']];

test('every drawing names an object of k.objects', () => {
  let n = 0;
  for (const [world, type] of CORES) for (const w of all(world, type)) for (const d of w.attrs.drawing ?? []) { n++; assert.ok(objects.has(tok(d)), `${world} ${tok(w.attrs.name[0])}: drawing ${d}`); }
  assert.ok(n > 150, `${n} drawings`);
});

test('k.animals has 150 animals and k.food 150 foods; every fact carries hand-core as its source', () => {
  assert.ok(all('k.animals', 'k.animals.animal').length >= 150);
  assert.ok(all('k.food', 'k.food.food').length >= 150);
  for (const [world, type] of CORES) for (const w of all(world, type)) assert.ok(handSources(w.attrs['core.source']), w.id);
});

test('k.space: the planets are numbered 1 to 8 by order and by size; what is orbited exists', () => {
  const bodies = all('k.space', 'k.space.body');
  const planets = bodies.filter((w) => tok(w.attrs.kind[0]) === 'planet');
  for (const key of ['order', 'size_rank']) assert.deepEqual(planets.map((w) => Number(w.attrs[key][0])).sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8], key);
  const known = names(bodies);
  for (const w of bodies) for (const key of ['orbits', 'in']) for (const v of w.attrs[key] ?? []) assert.ok(known.has(tok(v)), `${w.id} ${key}=${v}`);
  const kinds = names(all('k.space', 'k.space.kind'));
  for (const w of bodies) assert.ok(kinds.has(tok(w.attrs.kind[0])), `${w.id} kind`);
});

test('k.body: part_of, inside and the organs of the senses name parts that exist', () => {
  const parts = all('k.body', 'k.body.part');
  const known = names(parts);
  for (const w of parts) for (const key of ['part_of', 'inside']) for (const v of w.attrs[key] ?? []) assert.ok(known.has(tok(v)), `${w.id} ${key}=${v}`);
  for (const w of all('k.body', 'k.body.sense')) assert.ok(known.has(tok(w.attrs.organ[0])), w.id);
});

test('k.food: what a food comes from is a food, an animal of k.animals, or one of a few plants and places', () => {
  const foods = all('k.food', 'k.food.food');
  const known = new Set([...names(foods), ...names(all('k.animals', 'k.animals.animal')),
    'sea', 'river', 'fruit', 'meat', 'cocoa beans', 'sugar cane', 'sugar beet', 'maple tree', 'tea leaves', 'coffee beans', 'peppercorns', 'tree bark', 'mustard seeds', 'sunflower seeds']);
  for (const w of foods) for (const v of w.attrs.comes_from ?? []) assert.ok(known.has(tok(v)), `${w.id} comes_from=${v}`);
});

test('an approximate count (_about) is never next to the exact one; a verb is never in can and in cannot (Q18, Q19)', () => {
  let about = 0;
  for (const [world, type] of CORES) for (const w of all(world, type)) {
    for (const key of Object.keys(w.attrs)) if (key.endsWith('_about')) { about++; assert.equal(w.attrs[key.slice(0, -6)], undefined, `${w.id}: ${key} and ${key.slice(0, -6)}`); }
    for (const v of w.attrs.cannot ?? []) assert.ok(!(w.attrs.can ?? []).includes(v), `${w.id}: can and cannot ${v}`);
  }
  assert.ok(about >= 4);
  const flightless = fullWorld('k.animals', worlds).query({ type: 'k.animals.animal', where: { class: 'bird', cannot: 'fly' }, seek: 'name', mode: 'list' });
  assert.deepEqual([...flightless.values].sort(), ['cassowary', 'emu', 'kiwi', 'ostrich', 'penguin']);
  const animals = fullWorld('k.animals', worlds).fork();
  assert.equal(animals.tell('@a1 k.animals.animal name=dragon class=reptile can=fly cannot=fly', { ns: 'app' }).ok, false);
  assert.equal(animals.tell('@a2 k.animals.animal name=drake class=reptile can=fly cannot=swim', { ns: 'app' }).ok, true);
  const space = fullWorld('k.space', worlds).fork();
  assert.equal(space.tell('@a1 k.space.body name=Zog kind=planet moons=3 moons_about=4', { ns: 'app' }).ok, false);
  assert.equal(space.tell('@a2 k.space.body name=Zag kind=planet moons_about=4', { ns: 'app' }).ok, true);
});
