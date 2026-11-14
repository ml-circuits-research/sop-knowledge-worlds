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
  // Q33: Macao, Northern Cyprus and Åland (no capital in either source) are no longer called independent.
  assert.deepEqual(without.sort(), []);
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
  assert.equal(units.query({ type: 'k.units.measure', where: { world: 'k.drawing', type: 'part', key: 'x' }, seek: 'frame' }).value, 'drawing');
  assert.equal(units.query({ type: 'k.units.measure', where: { world: 'k.values', type: 'step', key: 'rank' }, seek: 'ordinal' }).value, 'true');
});

test('natural questions (Round 9 item 8): of the seeded sample of 100 about geography, at least 90 find a fact', () => {
  const r = sample('geo');
  assert.equal(r.asked, 100);
  assert.ok(r.found >= 90, `${r.found} of 100`);
});

test('Q33: capitals of today (Gitega, Astana, Ngerulmud), independence by sovereign, Cyprus counted in Europe politically', () => {
  const ask = (name, seek) => geo.query({ type: 'k.geo.country', where: { name }, seek, mode: 'list' }).values?.map(String) ?? [];
  assert.deepEqual(ask('Burundi', 'capital'), ['Gitega']);
  assert.deepEqual(ask('Kazakhstan', 'capital'), ['Astana']);
  assert.deepEqual(ask('Palau', 'capital'), ['Ngerulmud']);
  const city = (name) => geo.ofType('k.geo.city').find((c) => one(c, 'name') === name);
  assert.equal(one(city('Gitega'), 'capital_of'), 'Burundi');
  assert.equal(one(city('Bujumbura'), 'capital_of'), undefined);
  assert.equal(one(city('Astana'), 'capital_of'), 'Kazakhstan');
  assert.equal(city('Nur-Sultan'), undefined, 'renamed: Nur-Sultan is a word for Astana');
  const country = (name) => geo.ofType('k.geo.country').find((c) => one(c, 'name') === name && c.attrs.independent);
  for (const n of ['Cuba', 'Israel', 'Kazakhstan', 'Cyprus', 'France']) assert.equal(one(country(n), 'independent'), 'true', n);
  for (const n of ['Aruba', 'Curaçao', '"Sint Maarten"', 'Guernsey', 'Jersey', '"Isle of Man"', 'Greenland', '"Hong Kong"', 'Macao', 'Åland']) assert.equal(one(country(tok(n)), 'independent'), 'false', n);
  for (const n of ['Taiwan', 'Kosovo', 'Somaliland', 'Northern Cyprus']) assert.equal(country(n), undefined, `${n}: independent is not said`);
  // Q41: recognition=limited for those four and no other, on the wire of Natural Earth.
  const limited = geo.ofType('k.geo.country').filter((c) => c.attrs.recognition);
  assert.deepEqual(limited.map((c) => one(c, 'name').replace(/"/g, '')).sort(), ['Kosovo', 'Northern Cyprus', 'Somaliland', 'Taiwan']);
  for (const c of limited) assert.equal(one(c, 'recognition'), 'limited');
  const cyprus = geo.ofType('k.geo.country').filter((c) => one(c, 'name') === 'Cyprus');
  assert.deepEqual(cyprus.map((c) => one(c, 'continent')).filter(Boolean), ['Asia']);
  assert.deepEqual(cyprus.map((c) => one(c, 'political_continent')).filter(Boolean), ['Europe']);
  assert.equal(geo.ofType('k.geo.country').filter((c) => c.attrs.political_continent).length, 1);
});

test('block 07:40 item 3: other names of places (WordNet synonyms that are proper names, Natural Earth namepar), fresh', async () => {
  const { aliasesShard } = await import('../tools/geo-aliases.mjs');
  assert.equal(readFileSync(join(WORLDS_DIR, 'k.geo', 'shards', 'aliases.sop'), 'utf8'), aliasesShard());
  const geo = fullWorld('k.geo', worlds);
  const words = geo.ofType('core.word');
  const means = (t, of) => words.filter((w) => (w.attrs.text ?? []).map(tok).includes(t) && one(w, 'of') === of).map((w) => one(w, 'means'));
  assert.deepEqual(means('Peking', 'k.geo.city.name'), ['Beijing']);
  assert.deepEqual(means('Bombay', 'k.geo.city.name'), ['Mumbai']);
  assert.deepEqual(means('Calcutta', 'k.geo.city.name'), ['Kolkata']);
  assert.deepEqual(means('Persia', 'k.geo.country.name'), ['Iran']);
  assert.deepEqual(means('Zaire', 'k.geo.country.name'), [], 'Zaire is the other Congo');
  assert.deepEqual(means('Soviet Union', 'k.geo.country.name'), [], 'a former state is not Russia');
  assert.deepEqual(means('Peach State', 'k.geo.country.name'), [], 'the US state is not the country Georgia');
  const places = new Set(geo.ofType('k.geo.country').concat(geo.ofType('k.geo.city')).map((w) => one(w, 'name')));
  for (const w of words.filter((x) => /^k\.geo\.word\.alias\./.test(x.id))) for (const t of (w.attrs.text ?? []).map(tok)) assert.ok(!places.has(t), `${t} is a place of its own`);
});

test('reviewer 04:10 item 2: every capital of a country is a k.geo city whose capital_of is that country; the list spellings of the same places are words', () => {
  const cities = geo.ofType('k.geo.city');
  const capitalOf = new Map();
  for (const c of cities) for (const k of c.attrs.capital_of ?? []) { const n = one(c, 'name'); if (!capitalOf.has(n)) capitalOf.set(n, new Set()); capitalOf.get(n).add(tok(k)); }
  const missing = [];
  for (const c of geo.ofType('k.geo.country')) for (const cap of (c.attrs.capital ?? []).map(tok)) if (!capitalOf.get(cap)?.has(one(c, 'name'))) missing.push(`${one(c, 'name')}: ${cap}`);
  assert.deepEqual(missing, []);
  assert.equal(geo.check().issues.filter((i) => i.kind === 'open-join' && i.key === 'capital').length, 0);
  for (const [list, ne, country] of [['Hagåtña', 'Agana', 'Guam'], ['Papeetē', 'Papeete', '"French Polynesia"'], ['Cockburn Town', 'Grand Turk', '"Turks and Caicos Islands"']]) {
    assert.ok(geo.ofType('core.word').some((w) => (w.attrs.text ?? []).map(tok).includes(list) && one(w, 'means') === ne), list);
    assert.deepEqual(geo.query({ type: 'k.geo.country', where: { name: country }, seek: 'capital', mode: 'list' }).values?.map(String).map(tok), [ne], ne);
  }
  // the list's own cities, where Natural Earth has none of that name: a name, a country and capital_of, nothing else
  for (const n of ['Diego Garcia', 'King Edward Point', 'Fakaofo', 'El Aaiún', 'Ngerulmud', 'City of Victoria', 'Saipan']) {
    const c = cities.find((x) => one(x, 'name') === n);
    assert.ok(c && c.attrs.capital_of && !c.attrs.lat && !c.attrs.population, n);
  }
});

// KR1 item 2 (review 2026-11-15, finding 4): capitals were told in both directions (country.capital, city.capital_of)
// and had drifted: Oranjestad and The Bottom were capital_of Caribbean Netherlands, whose capital is Kralendijk.
test('KR1 item 2: a capital has one home (country.capital; capital_of only by the rule k.geo.capital_of), and a country has one capital unless the source says otherwise', async () => {
  const { parse } = await import('../tools/sopworld/sopworld.mjs');
  const entry = worlds.find((w) => w.id === 'k.geo');
  const told = entry.shards.filter((s) => !s.id.split('/').pop().startsWith('derived')).flatMap((s) => parse(s.text));
  assert.deepEqual(told.filter((w) => w.attrs.capital_of).map((w) => w.id), [], 'no told capital_of');
  for (const s of entry.shards.filter((x) => x.id.split('/').pop().startsWith('derived'))) for (const w of parse(s.text)) if (w.attrs.capital_of) assert.deepEqual(w.attrs['core.source'], ['"rule k.geo.capital_of"'], w.id);
  // every capital is a told city of its country (the rule only adds capital_of to a city that is there)
  const toldCities = new Set(told.filter((w) => w.type === 'k.geo.city').map((w) => `${one(w, 'name')}|${one(w, 'country')}`));
  const caps = new Map();
  for (const w of told.filter((x) => x.type === 'k.geo.country')) for (const c of (w.attrs.capital ?? []).map(tok)) {
    const n = one(w, 'name');
    if (!caps.has(n)) caps.set(n, new Set());
    caps.get(n).add(c);
    assert.ok(toldCities.has(`${c}|${n}`), `${n}: ${c} is no told city of it`);
  }
  // the country list 5.1.0 names three capitals of South Africa, and Natural Earth marks the three; nowhere else
  // does a source this world reads say a country has several (Natural Earth's other marks: tools/import/geo.mjs)
  const several = [...caps].filter(([, s]) => s.size > 1).map(([c, s]) => `${c}: ${[...s].sort().join(', ')}`);
  assert.deepEqual(several, ['South Africa: Bloemfontein, Cape Town, Pretoria']);
  // loaded with the rule, capital_of reads country.capital backwards, and only that
  const capitalOf = geo.ofType('k.geo.city').filter((c) => c.attrs.capital_of).map((c) => `${one(c, 'capital_of')}: ${one(c, 'name')}`).sort();
  assert.deepEqual(capitalOf, [...caps].flatMap(([n, s]) => [...s].map((c) => `${n}: ${c}`)).sort());
  assert.deepEqual(geo.query({ type: 'k.geo.country', where: { name: '"Caribbean Netherlands"' }, seek: 'capital', mode: 'list' }).values?.map(String).map(tok), ['Kralendijk']);
  for (const n of ['Oranjestad', 'The Bottom']) for (const c of geo.ofType('k.geo.city').filter((x) => one(x, 'name') === n)) assert.notEqual(one(c, 'capital_of'), 'Caribbean Netherlands', n);
  for (const [country, city] of [['Bolivia', 'Sucre'], ['Benin', 'Porto-Novo'], ['Nigeria', 'Abuja'], ['Japan', 'Tokyo']]) assert.deepEqual([...caps.get(country)], [city], country);
});
