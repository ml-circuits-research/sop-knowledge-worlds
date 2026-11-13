// k.geo (Round 9 item 3): capitals by lookup, lakes, deserts, seas, the hand-written approximate numbers; and
// k.units.measure: the unit of every number of the worlds it lists.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR, scanWorlds, fullWorld } from '../tools/lib/worlds.mjs';
import { numbersShard, RIVERS, SEAS, DESERTS, CONTINENTS } from '../tools/geo-numbers.mjs';
import { measuresShard, measureRows, numericSlots, MEASURES } from '../tools/measures-core.mjs';
import { sample } from '../tools/ask-sample.mjs';

const worlds = scanWorlds();
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const one = (w, k) => tok(w.attrs[k]?.[0]);
const geo = fullWorld('k.geo', worlds);

test('"capital of X" is answered by lookup for every independent country but three', () => {
  const without = [];
  for (const c of geo.ofType('k.geo.country')) {
    if (one(c, 'independent') !== 'true') continue;
    if (geo.query({ type: 'k.geo.country', where: { name: c.attrs.name[0] }, seek: 'capital' }).status !== 'supported') without.push(one(c, 'name'));
  }
  // Neither Natural Earth nor the country list names a capital for these.
  assert.deepEqual(without.sort(), ['Macao', 'Northern Cyprus', 'Åland']);
  assert.equal(geo.query({ type: 'k.geo.country', where: { name: '"South Sudan"' }, seek: 'capital' }).value, 'Juba');
  assert.equal(geo.query({ type: 'k.geo.country', where: { name: 'France' }, seek: 'capital' }).value, 'Paris');
});

test('100 lakes with the area of their outline; deserts; oceans and seas', () => {
  const lakes = geo.ofType('k.geo.lake');
  assert.equal(lakes.length, 100);
  for (const l of lakes) { assert.ok(Number(one(l, 'area_about')) >= 1000, l.id); assert.ok(l.attrs.country?.length, l.id); assert.deepEqual(l.attrs['core.source'], ['"natural-earth 5.1.2"'], l.id); }
  const area = (name) => Number(geo.query({ type: 'k.geo.lake', where: { name: JSON.stringify(name) }, seek: 'area_about' }).value);
  // The usual figures: Superior 82,100, Victoria 68,900 to 69,500, Baikal 31,500, Titicaca 8,370.
  assert.ok(Math.abs(area('Lake Superior') - 82100) < 1000 && Math.abs(area('Lake Victoria') - 69000) < 2500 && Math.abs(area('Lake Baikal') - 31500) < 800 && Math.abs(area('Lake Titicaca') - 8370) < 400);
  assert.ok(geo.ofType('k.geo.desert').length >= 55);
  const seas = geo.ofType('k.geo.sea');
  assert.deepEqual(seas.filter((s) => one(s, 'kind') === 'ocean').map((s) => one(s, 'name')).sort(), ['Arctic Ocean', 'Atlantic Ocean', 'Indian Ocean', 'Pacific Ocean', 'Southern Ocean']);
  assert.ok(seas.length >= 70);
});

test('the shard numbers is what tools/geo-numbers.mjs gives; each fact joins an imported one; the figures are in order', () => {
  assert.equal(readFileSync(join(WORLDS_DIR, 'k.geo', 'shards', 'numbers.sop'), 'utf8'), numbersShard());
  for (const [name, continent, km] of RIVERS) {
    const rivers = geo.ofType('k.geo.river').filter((r) => one(r, 'name') === name && one(r, 'continent') === continent);
    assert.equal(rivers.length, 1, name);
    assert.equal(Number(one(rivers[0], 'length_about')), km, name);
    assert.ok(rivers[0].attrs.country?.length && rivers[0].attrs.named?.[0] === 'model', name);
    assert.ok(km > 200 && km < 7000, name);
  }
  for (const [name] of SEAS) assert.ok(geo.ofType('k.geo.sea').some((s) => one(s, 'name') === name && s.attrs.kind && s.attrs.area_about), name);
  for (const [name] of DESERTS) assert.ok(geo.ofType('k.geo.desert').some((s) => one(s, 'name') === name && s.attrs.continent && s.attrs.area_about), name);
  assert.deepEqual(CONTINENTS.map((c) => c[0]).sort(), geo.ofType('k.geo.continent').map((c) => one(c, 'name')).sort());
  // The Pacific is larger than all the land; the Nile and the Amazon are the two longest rivers.
  assert.ok(SEAS[0][1] > CONTINENTS.reduce((n, c) => n + c[1], 0));
  assert.deepEqual([...RIVERS].sort((a, b) => b[2] - a[2]).slice(0, 2).map((r) => r[0]), ['Nile', 'Amazonas']);
  assert.equal(geo.query({ type: 'k.geo.river', where: { name: 'Nile' }, seek: 'length_about' }).value, '6650');
});

test('k.units.measure: every number of every world has its unit, what it counts, its frame, or is a place in an order or a plain number (Q31)', () => {
  assert.equal(readFileSync(join(WORLDS_DIR, 'k.units', 'shards', 'measures.sop'), 'utf8'), measuresShard());
  const units = fullWorld('k.units', worlds);
  const names = new Set(units.ofType('k.units.unit').map((u) => one(u, 'name')));
  const measures = units.ofType('k.units.measure');
  let slots = 0;
  for (const { id: world, schemaText } of worlds) for (const [type, key] of numericSlots(schemaText, world)) {
    slots++;
    const m = measures.filter((x) => one(x, 'world') === world && one(x, 'type') === type && one(x, 'key') === key);
    assert.equal(m.length, 1, `${world}.${type}.${key}`);
    assert.equal([m[0].attrs.unit, m[0].attrs.counts, m[0].attrs.ordinal, m[0].attrs.frame, m[0].attrs.plain].filter(Boolean).length, 1, m[0].id);
    if (m[0].attrs.unit) assert.ok(names.has(one(m[0], 'unit')), m[0].id);
    assert.equal(one(m[0], 'approximate') === 'true', key.endsWith('_about'), m[0].id);
  }
  assert.equal(measures.length, slots);
  assert.equal(measureRows().length, slots);
  assert.equal(units.query({ type: 'k.units.measure', where: { world: 'k.geo', type: 'mountain', key: 'elevation' }, seek: 'unit' }).value, 'metre');
  assert.equal(units.fork().tell('@m1 k.units.measure world=k.app type=thing key=n unit=metre counts=thing', { ns: 'app' }).ok, false);
  // The refusal holds for every world: a world that is not in the table at all, with a number, is an error.
  const extra = { id: 'k.new', schemaText: '@k.new.t core.type of=k.new.t\n@k.new.t.n core.slot of=k.new.t key=n kind=number\n', shards: [] };
  assert.throws(() => measureRows([...worlds, extra]), /k\.new\.t\.n has no unit/);
  assert.equal(units.query({ type: 'k.units.measure', where: { world: 'k.objects', type: 'part', key: 'x' }, seek: 'frame' }).value, 'object');
  assert.equal(units.query({ type: 'k.units.measure', where: { world: 'k.values', type: 'step', key: 'rank' }, seek: 'ordinal' }).value, 'true');
});

test('natural questions (Round 9 item 8): of the seeded sample of 100 about geography, at least 90 find a fact', () => {
  const r = sample('geo');
  assert.equal(r.asked, 100);
  assert.ok(r.found >= 90, `${r.found} of 100`);
});
