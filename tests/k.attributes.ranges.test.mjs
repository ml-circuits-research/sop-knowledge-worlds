// k.attributes typical ranges (block 15:15 item 3) and typicality (block 14:15 item 2), written as integration cases
// the library's interest scoring (range_distance of k.interest) and std.sample can read in place.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from '../tools/sopworld/sopworld.mjs';
import { scanWorlds, fullWorld, WORLDS_DIR } from '../tools/lib/worlds.mjs';
import { shards, quartiles, MIN } from '../tools/ranges-core.mjs';

const worlds = scanWorlds();
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const one = (w, k) => tok(w.attrs[k]?.[0]);
const v = (w, k) => (w.attrs[k] ?? []).map(tok);
const wiresOf = (id) => worlds.find((w) => w.id === id).shards.flatMap((s) => parse(s.text));
const attrs = wiresOf('k.attributes');
const ranges = attrs.filter((w) => w.type === 'k.attributes.range');
const typical = attrs.filter((w) => w.type === 'k.attributes.typical');
// a knowledge world's schema, or a world schema's (w.seating: not a world of facts, read from its file)
const schemaOf = (type) => {
  const w = worlds.find((x) => type.startsWith(`${x.id}.`));
  if (w) return parse(w.schemaText);
  const id = type.split('.').slice(0, 2).join('.');
  try { return parse(readFileSync(join(WORLDS_DIR, id, 'schema.sop'), 'utf8')); } catch { return null; }
};
const keysOf = (type) => { // the keys of a type, with those it inherits (extends)
  const s = schemaOf(type);
  if (!s) return new Set();
  const own = s.filter((w) => w.type === 'core.slot' && one(w, 'of') === type).map((w) => one(w, 'key'));
  const parent = s.find((w) => w.type === 'core.type' && one(w, 'of') === type && one(w, 'extends'));
  return new Set([...own, ...(parent ? [...keysOf(one(parent, 'extends'))] : [])]);
};

test('ranges: the shards are what tools/ranges-core.mjs gives (the catalog\'s numbers, the hand ranges)', () => {
  for (const [f, text] of Object.entries(shards(worlds))) assert.equal(readFileSync(join(WORLDS_DIR, 'k.attributes/shards', f), 'utf8'), text, f);
});

test('ranges: every range names numbers that exist, with their unit in k.units.measure, a known kind, low < median < high, and its basis', () => {
  const units = fullWorld('k.units', worlds).ofType('k.units.measure');
  const kinds = new Set([...attrs.filter((w) => w.type === 'k.attributes.kind').map((w) => one(w, 'name')), ...wiresOf('k.animals').filter((w) => w.type === 'k.animals.animal').map((w) => one(w, 'class')),
    ...wiresOf('k.people').filter((w) => w.type === 'k.people.kind').map((w) => one(w, 'name')), ...attrs.filter((w) => w.type === 'k.attributes.thing').map((w) => one(w, 'name'))]);
  for (const r of ranges) {
    const type = one(r, 'type'), key = one(r, 'key');
    assert.ok(keysOf(type).has(key), `${r.id}: ${type} has the key ${key}`);
    if (type.startsWith('k.')) {
      const world = worlds.find((x) => type.startsWith(`${x.id}.`)).id;
      assert.ok(units.some((m) => one(m, 'world') === world && `${world}.${one(m, 'type')}` === type && one(m, 'key') === key && (m.attrs.unit || m.attrs.counts)), `${r.id}: unit of ${type}.${key}`);
    }
    if (one(r, 'kind')) assert.ok(kinds.has(one(r, 'kind')), `${r.id}: kind ${one(r, 'kind')}`);
    const low = Number(one(r, 'low')), high = Number(one(r, 'high'));
    assert.ok(low < high, `${r.id}: low < high`);
    if (one(r, 'median')) assert.ok(low <= Number(one(r, 'median')) && Number(one(r, 'median')) <= high, `${r.id}: median inside`);
    const basis = one(r, 'basis');
    if (basis === 'catalog') assert.ok(Number(one(r, 'count')) >= MIN, `${r.id}: at least ${MIN} numbers`);
    if (basis === 'source') assert.ok(one(r, 'cite') && one(r, 'own'), `${r.id}: a sourced range cites its work and says what was taken`);
    if (basis === 'own') assert.ok(one(r, 'own'), `${r.id}: own says what`);
  }
});

test('ranges: a catalog range is the quartiles of the numbers it names (elephant 5,000 kg is far above the animals; a dog is inside)', () => {
  const numbers = attrs.filter((w) => w.type === 'k.attributes.number');
  const things = new Map(attrs.filter((w) => w.type === 'k.attributes.thing').map((w) => [`${one(w, 'name')} ${one(w, 'sense') ?? ''}`, one(w, 'kind')]));
  const kindOf = (n) => things.get(`${one(n, 'name')} ${one(n, 'sense') ?? ''}`) ?? things.get(`${one(n, 'name')} `);
  const r = ranges.find((x) => one(x, 'type') === 'k.attributes.number' && one(x, 'key') === 'weight_about' && one(x, 'kind') === 'animal' && one(x, 'basis') === 'catalog');
  const xs = numbers.filter((n) => kindOf(n) === 'animal' && one(n, 'weight_about') !== undefined).map((n) => Number(one(n, 'weight_about')));
  const qs = quartiles(xs);
  assert.ok(Math.abs(qs.low - Number(one(r, 'low'))) / qs.low < 0.01 && Math.abs(qs.high - Number(one(r, 'high'))) / qs.high < 0.01, `${JSON.stringify(qs)} against ${one(r, 'low')}..${one(r, 'high')}`);
  // range_distance of k.interest: the distance to the nearer end in widths of the range; 0 inside
  const distance = (x, lo, hi) => (x > hi ? (x - hi) / (hi - lo) : x < lo ? (lo - x) / (hi - lo) : 0);
  const w = (name) => Number(one(numbers.find((n) => one(n, 'name') === name && !one(n, 'sense')), 'weight_about'));
  assert.ok(distance(w('elephant'), Number(one(r, 'low')), Number(one(r, 'high'))) > 10, 'elephant');
  assert.equal(distance(w('dog'), Number(one(r, 'low')), Number(one(r, 'high'))), 0, 'dog');
  const tall = ranges.find((x) => one(x, 'kind') === 'man');
  assert.ok(distance(2.72, Number(one(tall, 'low')), Number(one(tall, 'high'))) > 3, 'a man 2.72 m tall is far from the usual');
});

test('ranges: Wikidata (CC0): the mass and length of species, the height of buildings, the area of countries, each over more than 200 items', () => {
  const wd = ranges.filter((r) => v(r, 'core.source').includes('wikidata-typical 2026-11-14'));
  assert.deepEqual(wd.map((r) => `${one(r, 'type')} ${one(r, 'key')} ${one(r, 'kind') ?? ''}`).sort(), ['k.attributes.number size_about animal', 'k.attributes.number size_about building', 'k.attributes.number weight_about animal', 'k.geo.country area ']);
  for (const r of wd) assert.ok(one(r, 'basis') === 'source' && /^Wikidata \(CC0\)/.test(one(r, 'cite')) && Number(one(r, 'count')) > 200, r.id);
  // two populations of one kind: the buildings of the catalog (everyday) and of Wikidata (those with a height) overlap
  const b = (basis) => ranges.find((r) => one(r, 'kind') === 'building' && one(r, 'key') === 'size_about' && one(r, 'basis') === basis);
  assert.ok(Number(one(b('source'), 'high')) > Number(one(b('catalog'), 'low')) && Number(one(b('catalog'), 'high')) > Number(one(b('source'), 'low')));
  // most described species are small: the Wikidata median mass of a taxon is under the catalog's lower quartile of animals
  const m = (basis) => ranges.find((r) => one(r, 'kind') === 'animal' && one(r, 'key') === 'weight_about' && one(r, 'basis') === basis);
  assert.ok(Number(one(m('source'), 'median')) < Number(one(m('catalog'), 'low')));
});

test('typicality: every fact names a kind and an attribute (or a type and its key), with a weight in (0, 1]', () => {
  const kinds = new Map(attrs.filter((w) => w.type === 'k.attributes.kind').map((w) => [one(w, 'name'), new Set(v(w, 'attribute'))]));
  const attributes = new Set(attrs.filter((w) => w.type === 'k.attributes.attribute').map((w) => one(w, 'name')));
  const beyond = [];
  for (const t of typical) {
    const of = one(t, 'of'), a = one(t, 'attribute'), weight = Number(one(t, 'weight'));
    if (of.includes('.')) assert.ok(keysOf(of).has(a), `${t.id}: ${of} has the key ${a}`);
    else {
      assert.ok(kinds.has(of) && attributes.has(a), `${t.id}: a kind of k.attributes and one of its attributes`);
      if (!kinds.get(of).has(a)) beyond.push(`${of}.${a}`); // named of things of the kind beyond what k.attributes.kind lists (a person's age)
    }
    assert.ok(weight > 0 && weight <= 1, t.id);
  }
  assert.deepEqual(beyond, ['person.age', 'person.colour']);
});

test('coverage: the kinds std.sample hits in PSys2\'s tabs have typicality and, where they have numbers, ranges', () => {
  const ofs = new Set(typical.map((t) => one(t, 'of')));
  // world schemas: every kind (a face part through w.face.part, which they extend)
  const schemaKinds = worlds.length && ['w.seating', 'w.map', 'w.list', 'w.timeline', 'w.face'].flatMap((id) => [...readFileSync(join(WORLDS_DIR, id, 'schema.sop'), 'utf8').matchAll(/std\.schema\.kind of=(\S+)/g)].map((m) => m[1]));
  const faceParts = (k) => k.startsWith('w.face.') && k !== 'w.face.face';
  assert.deepEqual(schemaKinds.filter((k) => !ofs.has(k) && !(faceParts(k) && ofs.has('w.face.part'))), [], 'schema kinds without typicality');
  // drawings: the kinds of common things that have attributes beyond a few
  const kinds = attrs.filter((w) => w.type === 'k.attributes.kind' && v(w, 'attribute').length >= 3).map((w) => one(w, 'name'));
  const noTypical = kinds.filter((k) => !ofs.has(k));
  assert.ok(noTypical.length <= 8, `kinds without typicality: ${noTypical}`);
  // places of the map, people, guests and tables, list items (chart series): numbers with a range
  const hasRange = (type, key, kind) => ranges.some((r) => one(r, 'type') === type && one(r, 'key') === key && (kind === undefined || one(r, 'kind') === kind));
  for (const [type, key] of [['k.geo.country', 'population'], ['k.geo.country', 'area'], ['k.geo.city', 'population'], ['k.geo.mountain', 'elevation'], ['k.geo.river', 'length_about'], ['k.geo.lake', 'area_about'], ['w.seating.table', 'seats'], ['w.list.item', 'quantity']]) assert.ok(hasRange(type, key), `${type}.${key}`);
  for (const k of ['person', 'man', 'woman', 'child', 'baby', 'animal', 'mammal', 'bird', 'building', 'vehicle', 'furniture', 'plant']) assert.ok(hasRange('k.attributes.number', 'size_about', k), `size of ${k}`);
  const kindsWithRange = new Set(ranges.map((r) => `${one(r, 'type')} ${one(r, 'kind') ?? ''}`));
  console.log(`ranges: ${ranges.length} (${ranges.filter((r) => one(r, 'basis') === 'catalog').length} from the catalog, ${ranges.filter((r) => one(r, 'basis') === 'source').length} sourced, ${ranges.filter((r) => one(r, 'basis') === 'own').length} own) over ${kindsWithRange.size} kinds; typicality: ${typical.length} facts over ${ofs.size} kinds and types; kinds without typicality: ${noTypical.join(', ') || 'none'}`);
});
