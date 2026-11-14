// Natural Earth 5.1.2 + mledoze/countries 5.1.0 -> k.geo shards. Per continent, from Natural Earth (public domain):
// countries (capital, continent, region, population, centre, bounding box), their largest cities, rivers, mountains
// and mountain ranges with names; and, in a second shard per continent, what only the country list has (ODbL):
// neighbours, area, landlocked, and the capital where Natural Earth marks none. The two shards name the same
// countries, so their facts merge when both are told. Round 9: the 100 largest lakes with the area of their
// outline, the deserts, and a shard `seas` with the oceans, seas, gulfs, bays, straits and channels.
// No geometry beyond a centre point and a bounding box. Deterministic.
//   node tools/import/geo.mjs [--ne sources/natural-earth/raw]   (then writes numbers.sop again: tools/geo-numbers.mjs)
//   options:                  [--ne sources/natural-earth/raw] [--countries sources/countries/raw/countries.json]
//                             [--out docs/worlds/k.geo/shards]
// How to fetch the raw files: sources/natural-earth/SOURCE.md and sources/countries/SOURCE.md.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { byText, seg, wire, text, header, writeShards } from './lib.mjs';

export const NE = 'natural-earth 5.1.2';
export const MC = 'countries 5.1.0';
export const CITIES_PER_COUNTRY = 5;
export const CONTINENTS = ['Africa', 'Antarctica', 'Asia', 'Europe', 'North America', 'Oceania', 'South America'];
const clean = (t) => String(t).replace(/\s+/g, ' ').trim();
const r2 = (n) => String(Math.round(n * 100) / 100);
const shardName = (continent) => continent.toLowerCase().split(' ').join('-');

// Q33 (reviewer's answer): capitals that changed after the data of Natural Earth 5.1.2. The country list names the
// capital of today; Natural Earth's is no longer the capital (Bujumbura; Melekeok, the state Ngerulmud lies in) or the
// city was renamed (Nur-Sultan is Astana again since 2022; Natural Earth itself gives Astana as the city's other name,
// `namepar`, so the city keeps its Natural Earth source). The data cannot tell a rename from a spelling (Ulaanbaatar,
// Ulan Bator), so the countries are named here; the capital itself is taken from the list (the import checks it), and
// what only the list says (the country's capital, the city's capital_of) goes into the shard of the list.
export const CAPITAL_FROM_LIST = { BDI: 'Gitega', KAZ: 'Astana', PLW: 'Ngerulmud' };
export const CITY_RENAMED = { KAZ: { from: 'Nur-Sultan', to: 'Astana' } };
// Q33: independent. Natural Earth's TYPE says `Country` for territories of another state (Aruba, Greenland, Hong Kong,
// Jersey) and `Sovereignty` or `Disputed` for some states (Cuba, Kazakhstan, Israel); its SOVEREIGNT says who the
// sovereign is, and agrees with the country list everywhere but for states that govern themselves without being
// generally recognised. For those (Natural Earth notes "Claimed by" another state, or the list does not say
// independent: Taiwan, Kosovo, Somaliland, Northern Cyprus) `independent` is not said.
export const independentOf = (p, listed) => {
  const own = p.SOVEREIGNT ? p.SOVEREIGNT === p.ADMIN : p.TYPE === 'Sovereign country' || p.TYPE === 'Country';
  if (!own) return false;
  if (/Claimed by/.test(p.NOTE_BRK ?? '') || (listed && listed.independent !== undefined && listed.independent !== true)) return undefined;
  return true;
};
// Q41 (reviewer's answer): for those four, what is true and neutral: their recognition is limited. Said from Natural
// Earth alone (the shard of its licence): a country that is its own sovereign and that Natural Earth marks as
// administering itself while another state claims it (`NOTE_BRK` "Self admin.; Claimed by ...": Taiwan, Somaliland,
// Northern Cyprus), or as disputed with no code of its own in ISO 3166 (`TYPE` Disputed, `FCLASS_ISO` Unrecognized:
// Kosovo; Israel is Disputed with a code and is not marked). The import checks that this is exactly where
// `independent` is not said.
export const recognitionOf = (p) => {
  const own = p.SOVEREIGNT ? p.SOVEREIGNT === p.ADMIN : false;
  if (!own) return undefined;
  if (/^Self admin\.; Claimed by/.test(p.NOTE_BRK ?? '') || (p.TYPE === 'Disputed' && p.FCLASS_ISO === 'Unrecognized')) return 'limited';
  return undefined;
};
// Q33: the continent a country is counted in politically, from the region of the country list, where that is another
// continent than the geographic one of Natural Earth (Cyprus: Asia, politically Europe). Not for islands in the open
// ocean, whose continent is already that of their UN region.
const listContinent = (c) => (c.region === 'Americas' ? (c.subregion === 'South America' ? 'South America' : 'North America') : c.region === 'Antarctic' ? 'Antarctica' : c.region);

// The continent of a Natural Earth country: its CONTINENT, or for islands in the open ocean its UN region.
export const continentOf = (p) => {
  if (CONTINENTS.includes(p.CONTINENT)) return p.CONTINENT;
  if (p.REGION_UN === 'Americas') return p.SUBREGION === 'South America' ? 'South America' : 'North America';
  return CONTINENTS.includes(p.REGION_UN) ? p.REGION_UN : 'Antarctica';
};

// The English name of a feature when Natural Earth has one, else its name; a name in capitals (ALPS) is written Alps.
const english = (en, name) => {
  const t = (en ?? name ?? '').trim();
  return /[a-z]/.test(t) ? t : t.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
};

// The identity of a country: its common short name. Natural Earth's NAME or NAME_LONG, whichever is shorter and
// written in full ("United States", "Serbia"); where both are abbreviated ("Falkland Is."), its ADMIN name.
const abbreviated = (t) => /\.|\//.test(t) || /(^|\s)St-/.test(t);
export const commonName = (p) => {
  const full = [p.NAME, p.NAME_LONG].filter((t) => t && !abbreviated(t)).sort((a, b) => a.length - b.length || byText(a, b));
  return full[0] ?? p.ADMIN;
};

const rings = (g) => (g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []);
const lines = (g) => (g.type === 'LineString' ? [g.coordinates] : g.type === 'MultiLineString' ? g.coordinates : []);
const bounds = (points) => {
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  for (const [x, y] of points) { if (x < w) w = x; if (x > e) e = x; if (y < s) s = y; if (y > n) n = y; }
  return { w, s, e, n };
};
const box = (b) => [['west', r2(b.w)], ['south', r2(b.s)], ['east', r2(b.e)], ['north', r2(b.n)]];
const centre = (b) => [['lat', r2((b.s + b.n) / 2)], ['lon', r2((b.w + b.e) / 2)]];
// Round 9: the area of a polygon on the sphere, in square kilometres (mean radius 6371.0088 km).
const RAD = Math.PI / 180, EARTH = 6371.0088;
const ringArea = (ring) => {
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    let dx = ring[i + 1][0] - ring[i][0];
    if (dx > 180) dx -= 360; else if (dx < -180) dx += 360;
    sum += dx * RAD * (2 + Math.sin(ring[i][1] * RAD) + Math.sin(ring[i + 1][1] * RAD));
  }
  return Math.abs(sum * EARTH * EARTH / 2);
};
export const sphereArea = (g) => rings(g).reduce((n, poly) => n + ringArea(poly[0]) - poly.slice(1).reduce((m, hole) => m + ringArea(hole), 0), 0);
// An approximate number keeps three significant digits.
export const round3 = (n) => { const k = 10 ** Math.max(0, Math.floor(Math.log10(Math.max(1, n))) - 2); return Math.round(n / k) * k; };
export const LAKES = 100;
export const SEA_KINDS = ['ocean', 'sea', 'gulf', 'bay', 'strait', 'channel'];
// The name of a lake: Natural Earth's name ("Lake Victoria", "Great Bear Lake", "IJsselmeer"); where that name has
// the word for lake of another language ("Lago Titicaca", "Qinghai Hu", "Uvs Nuur"), "Lake" and the English name
// ("Lake Titicaca"). Bays and channels of a lake and lagoons are not lakes of their own: null.
const lakeName = (p) => {
  const name = clean(p.name), en = clean(p.name_en ?? '').split('/')[0].replace(/ (Hu|Nuur|Co|Köli)$/, '');
  if (/ (Bay|Channel)$/.test(name) || /^(Laguna|Lagoa) /.test(name)) return null;
  if (!en || !(/^(Lago( de)?|Lac|Danau) [^l-]/.test(name) || / (Hu|Nuur|Co|Köli|Ko‘l)$/.test(name) || /jrvi$/.test(name))) return name;
  return / Lake$/.test(en) ? en : `Lake ${en}`;
};
const inRing = (x, y, ring) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

// input: { countries (array of the country list), admin, places, rivers, elevations, regions (GeoJSON features) }
export function importGeo({ countries, admin, places, rivers, elevations, regions, lakes = [], marine = [] }, { citiesPerCountry = CITIES_PER_COUNTRY } = {}) {
  const stats = { countries: 0, borders: 0, cities: 0, rivers: 0, mountains: 0, ranges: 0, lakes: 0, deserts: 0, seas: 0, capitalsFromList: 0, words: 0, dropped: { countries: 0, cities: 0, rivers: 0, mountains: 0 } };
  // Natural Earth countries by their code: properties, polygons (for "which country is this point in"), bounds.
  const byCode = new Map();
  const shapes = [];
  for (const f of admin) {
    const p = f.properties;
    if (p.TYPE === 'Indeterminate' || !p.ADMIN || byCode.has(p.ADM0_A3)) { stats.dropped.countries++; continue; }
    const polys = rings(f.geometry).map((poly) => ({ poly, b: bounds(poly[0]) }));
    const b = bounds(polys.flatMap((x) => x.poly[0]));
    byCode.set(p.ADM0_A3, { p, b, name: commonName(p), continent: continentOf(p) });
    shapes.push({ code: p.ADM0_A3, polys, b });
  }
  const nameOf = (code) => byCode.get(code)?.name;
  const codeOf = (...codes) => codes.find((c) => c && byCode.has(c));
  const countryAt = (x, y) => {
    for (const s of shapes) {
      if (x < s.b.w || x > s.b.e || y < s.b.s || y > s.b.n) continue;
      for (const { poly, b } of s.polys) {
        if (x < b.w || x > b.e || y < b.s || y > b.n) continue;
        if (inRing(x, y, poly[0]) && !poly.slice(1).some((hole) => inRing(x, y, hole))) return s.code;
      }
    }
    return null;
  };

  const shards = new Map(CONTINENTS.map((c) => [c, { countries: [], cities: [], rivers: [], mountains: [], ranges: [], lakes: [], deserts: [], words: [], borders: [] }]));
  const noCapital = new Set();
  const sources = (...s) => s;
  const w = (id, type, entries, srcs) => wire(id, type, entries, srcs[0]) + srcs.slice(1).map((s) => ` core.source=${JSON.stringify(s)}`).join('');

  // Capitals: the places Natural Earth marks as national capitals, per country code.
  const capitals = new Map();
  for (const f of places) {
    const p = f.properties;
    if (p.featurecla !== 'Admin-0 capital' && p.featurecla !== 'Admin-0 capital alt') continue;
    const code = codeOf(p.adm0_a3, p.sov_a3);
    if (!code || !p.name || CAPITAL_FROM_LIST[code]) continue;
    if (!capitals.has(code)) capitals.set(code, []);
    capitals.get(code).push(p);
  }
  // The country list by Natural Earth's code (the list's code -> Natural Earth's where they differ).
  const LIST_CODE = { UNK: 'KOS', PSE: 'PSX', SSD: 'SDS', ESH: 'SAH' };
  const neCode = (c) => (byCode.has(c) ? c : LIST_CODE[c]);
  const listed = new Map(countries.map((c) => [neCode(c.cca3), c]).filter(([k]) => k));
  for (const [code, capital] of Object.entries(CAPITAL_FROM_LIST)) {
    if (byCode.has(code) && listed.has(code) && !(listed.get(code).capital ?? []).includes(capital)) throw new Error(`the country list does not name ${capital} the capital of ${code}`);
  }
  const codes = [...byCode.keys()].sort((a, b) => byText(nameOf(a), nameOf(b)) || byText(a, b));
  for (const code of codes) {
    const { p, b, name, continent } = byCode.get(code);
    if ((recognitionOf(p) === 'limited') !== (independentOf(p, listed.get(code)) === undefined)) throw new Error(`${code}: recognition and independent disagree`);
    const out = shards.get(continent);
    const caps = (capitals.get(code) ?? []).map((c) => ({ ...c, name: clean(c.name) })).sort((x, y) => (x.featurecla === 'Admin-0 capital' ? 0 : 1) - (y.featurecla === 'Admin-0 capital' ? 0 : 1) || byText(x.name, y.name)).map((c) => c.name);
    if (!caps.length) noCapital.add(code);
    out.countries.push(w(`k.geo.country.${seg(code)}`, 'k.geo.country', [
      ['name', name], ['code', code], ['formal', p.FORMAL_EN ? text(p.FORMAL_EN) : undefined],
      ...[...new Set(caps)].map((x) => ['capital', x]),
      ['continent', continent], ['region', p.SUBREGION && !/^Seven seas/.test(p.SUBREGION) ? p.SUBREGION : undefined],
      ['population', p.POP_EST > 0 ? Math.round(p.POP_EST) : undefined],
      ['independent', independentOf(p, listed.get(code))], ['recognition', recognitionOf(p)],
      ['lat', Number.isFinite(p.LABEL_Y) ? r2(p.LABEL_Y) : r2((b.s + b.n) / 2)], ['lon', Number.isFinite(p.LABEL_X) ? r2(p.LABEL_X) : r2((b.w + b.e) / 2)],
      ...box(b),
    ], sources(NE)));
    stats.countries++;
    const other = [...new Set([p.ADMIN, p.NAME, p.NAME_LONG, p.NAME_EN, p.FORMAL_EN].filter((t) => t && t !== name))];
    if (other.length) {
      out.words.push(w(`k.geo.word.${seg(code)}`, 'core.word', [...other.map((t) => ['text', t]), ['means', name], ['of', 'k.geo.country.name']], sources(NE)));
      stats.words++;
    }
  }
  // What only the country list has: neighbours, area, landlocked. Joined by the country code; named as above.
  for (const c of [...countries].sort((a, b) => byText(a.cca3, b.cca3))) {
    const code = neCode(c.cca3);
    if (!code || !byCode.has(code)) continue;
    const { name, continent, p } = byCode.get(code);
    const political = CONTINENTS.includes(p.CONTINENT) && CONTINENTS.includes(listContinent(c)) && listContinent(c) !== continent ? listContinent(c) : undefined;
    shards.get(continent).borders.push({ name, line: w(`k.geo.borders.${seg(code)}`, 'k.geo.country', [
      ['name', name],
      // Round 9: the capital, where Natural Earth marks none (territories, South Sudan, Nauru).
      ...(noCapital.has(code) ? (c.capital ?? []).filter(Boolean).map((x) => { stats.capitalsFromList++; return ['capital', clean(x)]; }) : []),
      ...[...new Set(c.borders.map(neCode).map(nameOf).filter(Boolean))].sort(byText).map((n) => ['neighbour', n]),
      ['area', c.area > 0 ? r2(c.area) : undefined], ['landlocked', c.landlocked === true],
      ['political_continent', political],
    ], sources(MC)) });
    stats.borders++;
  }

  // Cities: every national capital and the largest places of each country.
  const perCountry = new Map();
  for (const f of places) {
    const p = f.properties;
    const code = codeOf(p.adm0_a3, p.sov_a3);
    if (!code || !p.name || !(p.pop_max > 0)) { stats.dropped.cities++; continue; }
    if (!perCountry.has(code)) perCountry.set(code, []);
    perCountry.get(code).push({ ...p, name: clean(p.name) });
  }
  for (const code of [...perCountry.keys()].sort(byText)) {
    const list = perCountry.get(code).sort((a, b) => b.pop_max - a.pop_max || byText(a.name, b.name));
    const renamed = CITY_RENAMED[code];
    for (const p of list) if (renamed && p.name === renamed.from) {
      if (p.namepar !== renamed.to && p.nameascii !== renamed.to) throw new Error(`Natural Earth does not give ${renamed.to} as a name of ${renamed.from}`);
      p.name = renamed.to;
    }
    // Q33: where the capital is the list's, Natural Earth's mark is not used; the place the list names keeps its
    // place among the cities, and its capital_of is said in the shard of the list.
    const listCapital = CAPITAL_FROM_LIST[code];
    const capital = (p) => (listCapital ? false : p.featurecla === 'Admin-0 capital' || p.featurecla === 'Admin-0 capital alt');
    const seen = new Set();
    const kept = [];
    list.forEach((p, i) => {
      if (seen.has(p.name) || !(i < citiesPerCountry || capital(p) || p.name === listCapital)) return;
      seen.add(p.name);
      kept.push(p);
    });
    const country = nameOf(code);
    const out = shards.get(byCode.get(code).continent);
    for (const p of kept.sort((a, b) => byText(a.name, b.name))) {
      out.cities.push(w(`k.geo.city.${code}.${seg(p.name)}`, 'k.geo.city', [
        ['name', p.name], ['country', country], ['capital_of', capital(p) ? country : undefined],
        ['population', Math.round(p.pop_max)], ['lat', r2(p.latitude)], ['lon', r2(p.longitude)],
      ], sources(NE)));
      // block 07:40 item 3: the city's former or other name in Natural Earth (`namepar`: Bombay, Madras, Rangoon)
      const par = clean(p.namepar ?? '');
      if (par && par !== p.name && !(renamed && par === renamed.to) && /^\p{Lu}[\p{L}\s'.-]*$/u.test(par)) { out.words.push(w(`k.geo.word.city.${code}.par.${seg(p.name)}`, 'core.word', [['text', par], ['means', p.name], ['of', 'k.geo.city.name']], sources(NE))); stats.words++; }
      if (renamed && p.name === renamed.to) out.words.push(w(`k.geo.word.city.${code}.${seg(renamed.from)}`, 'core.word', [['text', renamed.from], ['means', renamed.to], ['of', 'k.geo.city.name']], sources(NE)));
      if (p.name === listCapital) out.borders.push({ name: `${country} ${p.name}`, line: w(`k.geo.borders.city.${code}.${seg(p.name)}`, 'k.geo.city', [['name', p.name], ['country', country], ['capital_of', country]], sources(MC)) });
      stats.cities++;
    }
  }

  // Rivers: the pieces of one river (the same name, and lines that touch within half a degree) become one fact; its
  // countries are those its line passes through; its continent is the one most of its points are in.
  const pieces = new Map();
  for (const f of rivers) {
    const p = f.properties;
    const name = english(p.name_en, p.name);
    if (!name) { stats.dropped.rivers++; continue; }
    if (!pieces.has(name)) pieces.set(name, []);
    for (const line of lines(f.geometry)) if (line.length) pieces.get(name).push({ points: line, b: bounds(line) });
  }
  const near = (a, b) => a.w - 0.5 <= b.e && b.w - 0.5 <= a.e && a.s - 0.5 <= b.n && b.s - 0.5 <= a.n;
  const riverGroups = new Map();
  for (const name of [...pieces.keys()].sort(byText)) {
    const list = pieces.get(name);
    const group = list.map((_, i) => i);
    const find = (i) => (group[i] === i ? i : (group[i] = find(group[i])));
    for (let i = 0; i < list.length; i++) for (let j = 0; j < i; j++) if (near(list[i].b, list[j].b)) group[find(i)] = find(j);
    list.forEach((piece, i) => {
      const key = `${name}\u0000${String(find(i)).padStart(6, '0')}`;
      if (!riverGroups.has(key)) riverGroups.set(key, { name, points: [] });
      riverGroups.get(key).points.push(...piece.points);
    });
  }
  const riversByKey = new Map();
  for (const key of [...riverGroups.keys()].sort(byText)) {
    const g = riverGroups.get(key);
    const count = new Map();
    const step = Math.max(1, Math.floor(g.points.length / 200));
    for (let i = 0; i < g.points.length; i += step) {
      const code = countryAt(g.points[i][0], g.points[i][1]);
      if (code) count.set(code, (count.get(code) ?? 0) + 1);
    }
    if (!count.size) { stats.dropped.rivers++; continue; }
    const perContinent = new Map();
    for (const [code, n] of count) perContinent.set(byCode.get(code).continent, (perContinent.get(byCode.get(code).continent) ?? 0) + n);
    const continent = [...perContinent.keys()].sort((a, b) => perContinent.get(b) - perContinent.get(a) || byText(a, b))[0];
    // Two rivers of one name on one continent: the one with more points is kept (identity is name + continent).
    const id = `${g.name}\u0000${continent}`;
    const old = riversByKey.get(id);
    if (old) stats.dropped.rivers++;
    if (old && old.points.length >= g.points.length) continue;
    riversByKey.set(id, { ...g, continent, countries: [...count.keys()].map(nameOf).sort(byText) });
  }
  for (const id of [...riversByKey.keys()].sort(byText)) {
    const g = riversByKey.get(id);
    const b = bounds(g.points);
    shards.get(g.continent).rivers.push(w(`k.geo.river.${seg(g.name)}.${seg(shardName(g.continent))}`, 'k.geo.river', [
      ['name', g.name], ['continent', g.continent], ...g.countries.map((c) => ['country', c]), ...centre(b), ...box(b),
    ], sources(NE)));
    stats.rivers++;
  }

  // Mountains: named summits with their height in metres.
  const mountains = new Map();
  for (const f of elevations) {
    const p = f.properties;
    const name = english(p.name_en, p.name);
    if (p.featurecla !== 'mountain' || !name) continue;
    const [x, y] = f.geometry.coordinates;
    const code = countryAt(x, y);
    const continent = CONTINENTS.includes(p.region) ? p.region : code ? byCode.get(code).continent : null;
    if (!continent) { stats.dropped.mountains++; continue; }
    const id = `${name}\u0000${continent}`;
    if (mountains.has(id)) stats.dropped.mountains++;
    if (mountains.has(id) && mountains.get(id).elevation >= p.elevation) continue;
    mountains.set(id, { name, continent, country: code ? nameOf(code) : undefined, elevation: p.elevation, x, y });
  }
  for (const id of [...mountains.keys()].sort(byText)) {
    const m = mountains.get(id);
    shards.get(m.continent).mountains.push(w(`k.geo.mountain.${seg(m.name)}.${seg(shardName(m.continent))}`, 'k.geo.mountain', [
      ['name', m.name], ['continent', m.continent], ['country', m.country],
      ['elevation', Number.isFinite(m.elevation) ? Math.round(m.elevation) : undefined], ['lat', r2(m.y)], ['lon', r2(m.x)],
    ], sources(NE)));
    stats.mountains++;
  }

  // Mountain ranges: a name, a centre and a bounding box.
  const ranges = new Map();
  for (const f of regions) {
    const p = f.properties;
    const name = english(p.NAME_EN, p.NAME);
    if (p.FEATURECLA !== 'Range/mtn' || !name || !CONTINENTS.includes(p.REGION)) continue;
    const id = `${name}\u0000${p.REGION}`;
    const points = rings(f.geometry).flatMap((poly) => poly[0]);
    if (ranges.has(id)) ranges.get(id).points.push(...points);
    else ranges.set(id, { name, continent: p.REGION, points });
  }
  for (const id of [...ranges.keys()].sort(byText)) {
    const g = ranges.get(id);
    const b = bounds(g.points);
    shards.get(g.continent).ranges.push(w(`k.geo.range.${seg(g.name)}.${seg(shardName(g.continent))}`, 'k.geo.range', [
      ['name', g.name], ['continent', g.continent], ...centre(b), ...box(b),
    ], sources(NE)));
    stats.ranges++;
  }

  // Round 9. Lakes: the LAKES largest natural lakes by the area of their outline (no reservoirs), with that area in
  // square kilometres as `area_about` (worked out on the sphere from the 1:10m outline; water levels change).
  const lakeByName = new Map();
  for (const f of lakes) {
    const p = f.properties;
    if (!p.name || p.featurecla === 'Reservoir') continue;
    const name = lakeName(p);
    if (!name) continue;
    const g = lakeByName.get(name) ?? { name, area: 0, points: [], other: new Set() };
    g.area += sphereArea(f.geometry);
    g.points.push(...rings(f.geometry).flatMap((poly) => poly[0]));
    for (const t of [p.name, ...(p.name_alt ?? '').split('|')].map((x) => clean(x ?? '')).filter((x) => x && x !== name)) g.other.add(t);
    lakeByName.set(name, g);
  }
  for (const g of [...lakeByName.values()].sort((a, b) => b.area - a.area || byText(a.name, b.name)).slice(0, LAKES).sort((a, b) => byText(a.name, b.name))) {
    const b = bounds(g.points);
    const count = new Map();
    const step = Math.max(1, Math.floor(g.points.length / 300));
    for (let i = 0; i < g.points.length; i += step) { const code = countryAt(g.points[i][0], g.points[i][1]); if (code) count.set(code, (count.get(code) ?? 0) + 1); }
    if (!count.size) continue;
    const perContinent = new Map();
    for (const [code, n] of count) perContinent.set(byCode.get(code).continent, (perContinent.get(byCode.get(code).continent) ?? 0) + n);
    const continent = [...perContinent.keys()].sort((x, y) => perContinent.get(y) - perContinent.get(x) || byText(x, y))[0];
    const out = shards.get(continent);
    out.lakes.push(w(`k.geo.lake.${seg(g.name)}`, 'k.geo.lake', [['name', g.name], ['continent', continent], ...[...count.keys()].map(nameOf).sort(byText).map((c) => ['country', c]),
      ['area_about', round3(g.area)], ...centre(b), ...box(b)], sources(NE)));
    if (g.other.size) { out.words.push(w(`k.geo.word.lake.${seg(g.name)}`, 'core.word', [...[...g.other].sort(byText).map((t) => ['text', t]), ['means', g.name], ['of', 'k.geo.lake.name']], sources(NE))); stats.words++; }
    stats.lakes++;
  }
  // Deserts: a name, a continent, a centre and a bounding box (the outlines are for labels: no area from them).
  const deserts = new Map();
  for (const f of regions) {
    const p = f.properties;
    const name = english(p.NAME_EN, p.NAME);
    if (p.FEATURECLA !== 'Desert' || !name || !CONTINENTS.includes(p.REGION)) continue;
    const points = rings(f.geometry).flatMap((poly) => poly[0]);
    if (deserts.has(name)) deserts.get(name).points.push(...points); else deserts.set(name, { name, continent: p.REGION, points });
  }
  for (const name of [...deserts.keys()].sort(byText)) {
    const g = deserts.get(name);
    const b = bounds(g.points);
    shards.get(g.continent).deserts.push(w(`k.geo.desert.${seg(g.name)}`, 'k.geo.desert', [['name', g.name], ['continent', g.continent], ...centre(b), ...box(b)], sources(NE)));
    stats.deserts++;
  }
  // Seas: the oceans and the seas, gulfs, bays, straits and channels that Natural Earth ranks 0 to 3, by name.
  const seas = new Map();
  for (const f of marine) {
    const p = f.properties;
    const name = english(p.name_en, p.name);
    if (!name || !SEA_KINDS.includes(p.featurecla) || p.scalerank > 3) continue;
    const points = rings(f.geometry).flatMap((poly) => poly[0]);
    if (seas.has(name)) seas.get(name).points.push(...points); else seas.set(name, { name, kind: p.featurecla, points });
  }
  const seaLines = [];
  for (const name of [...seas.keys()].sort(byText)) {
    const g = seas.get(name);
    const b = bounds(g.points);
    seaLines.push(w(`k.geo.sea.${seg(g.name)}`, 'k.geo.sea', [['name', g.name], ['kind', g.kind], ...centre(b), ...box(b)], sources(NE)));
    stats.seas++;
  }

  const files = {};
  for (const continent of CONTINENTS) {
    const s = shards.get(continent);
    const name = shardName(continent);
    const body = [
      w(`k.geo.continent.${seg(name)}`, 'k.geo.continent', [['name', continent]], sources(NE)),
      ...s.countries, ...s.cities, ...s.rivers, ...s.mountains, ...s.ranges, ...s.lakes, ...s.deserts, ...s.words,
    ];
    files[`${name}.sop`] = `${header({
      id: `k.geo/shards/${name}`,
      about: `${continent}: ${s.countries.length} countries and territories, ${s.cities.length} cities, ${s.rivers.length} rivers, ${s.mountains.length} mountains, ${s.ranges.length} mountain ranges, ${s.lakes.length} lakes, ${s.deserts.length} deserts.`,
      sources: ['natural-earth 5.1.2 (Natural Earth, public domain)'],
      license: 'public-domain',
      script: 'tools/import/geo.mjs',
    })}\n${body.join('\n')}\n`;
    if (!s.borders.length) continue;
    files[`${name}-borders.sop`] = `${header({
      id: `k.geo/shards/${name}-borders`,
      about: `${continent}: the neighbours, the area in square kilometres and whether it is landlocked, for ${s.borders.filter((x) => x.line.includes(' k.geo.country ')).length} countries and territories, and the capital of those for which Natural Earth marks none or an older one. Tell it with the shard ${name}: the facts of one country merge.`,
      sources: ['countries 5.1.0 (mledoze/countries, ODbL-1.0)'],
      license: 'ODbL-1.0',
      script: 'tools/import/geo.mjs',
    })}\n${s.borders.sort((a, b) => byText(a.name, b.name)).map((x) => x.line).join('\n')}\n`;
  }
  if (seaLines.length) files['seas.sop'] = `${header({
    id: 'k.geo/shards/seas',
    about: `${seaLines.length} oceans, seas, gulfs, bays, straits and channels: the kind, a centre and a bounding box.`,
    sources: ['natural-earth 5.1.2 (Natural Earth, public domain)'], license: 'public-domain', script: 'tools/import/geo.mjs',
  })}\n${seaLines.join('\n')}\n`;
  return { files, stats };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const arg = (name, dflt) => { const i = process.argv.indexOf(`--${name}`); return i < 0 ? dflt : process.argv[i + 1]; };
  const ne = arg('ne', join(repo, 'sources/natural-earth/raw'));
  const features = (f) => JSON.parse(readFileSync(join(ne, `${f}.geojson`), 'utf8')).features;
  const { files, stats } = importGeo({
    countries: JSON.parse(readFileSync(arg('countries', join(repo, 'sources/countries/raw/countries.json')), 'utf8')),
    admin: features('ne_50m_admin_0_countries'),
    places: features('ne_10m_populated_places_simple'),
    rivers: features('ne_10m_rivers_lake_centerlines'),
    elevations: features('ne_10m_geography_regions_elevation_points'),
    regions: features('ne_10m_geography_regions_polys'),
    lakes: features('ne_10m_lakes'),
    marine: features('ne_10m_geography_marine_polys'),
  });
  const out = arg('out', join(repo, 'docs/worlds/k.geo/shards'));
  writeShards(out, files);
  // The hand-written numbers (tools/geo-numbers.mjs) name things of these shards: written again after them.
  if (out === join(repo, 'docs/worlds/k.geo/shards')) { const { numbersShard } = await import('../geo-numbers.mjs'); writeShards(out, { 'numbers.sop': numbersShard() }, 'numbers'); }
  console.log(JSON.stringify(stats));
}
