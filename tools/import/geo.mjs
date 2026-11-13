// Natural Earth 5.1.2 + mledoze/countries 5.1.0 -> k.geo shards. Per continent, from Natural Earth (public domain):
// countries (capital, continent, region, population, centre, bounding box), their largest cities, rivers, mountains
// and mountain ranges with names; and, in a second shard per continent, what only the country list has (ODbL):
// neighbours, area, landlocked. The two shards name the same countries, so their facts merge when both are told.
// No geometry beyond a centre point and a bounding box. Deterministic.
//   node tools/import/geo.mjs [--ne sources/natural-earth/raw] [--countries sources/countries/raw/countries.json]
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
const inRing = (x, y, ring) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

// input: { countries (array of the country list), admin, places, rivers, elevations, regions (GeoJSON features) }
export function importGeo({ countries, admin, places, rivers, elevations, regions }, { citiesPerCountry = CITIES_PER_COUNTRY } = {}) {
  const stats = { countries: 0, borders: 0, cities: 0, rivers: 0, mountains: 0, ranges: 0, words: 0, dropped: { countries: 0, cities: 0, rivers: 0, mountains: 0 } };
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

  const shards = new Map(CONTINENTS.map((c) => [c, { countries: [], cities: [], rivers: [], mountains: [], ranges: [], words: [], borders: [] }]));
  const sources = (...s) => s;
  const w = (id, type, entries, srcs) => wire(id, type, entries, srcs[0]) + srcs.slice(1).map((s) => ` core.source=${JSON.stringify(s)}`).join('');

  // Capitals: the places Natural Earth marks as national capitals, per country code.
  const capitals = new Map();
  for (const f of places) {
    const p = f.properties;
    if (p.featurecla !== 'Admin-0 capital' && p.featurecla !== 'Admin-0 capital alt') continue;
    const code = codeOf(p.adm0_a3, p.sov_a3);
    if (!code || !p.name) continue;
    if (!capitals.has(code)) capitals.set(code, []);
    capitals.get(code).push(p);
  }
  const codes = [...byCode.keys()].sort((a, b) => byText(nameOf(a), nameOf(b)) || byText(a, b));
  for (const code of codes) {
    const { p, b, name, continent } = byCode.get(code);
    const out = shards.get(continent);
    const caps = (capitals.get(code) ?? []).map((c) => ({ ...c, name: clean(c.name) })).sort((x, y) => (x.featurecla === 'Admin-0 capital' ? 0 : 1) - (y.featurecla === 'Admin-0 capital' ? 0 : 1) || byText(x.name, y.name)).map((c) => c.name);
    out.countries.push(w(`k.geo.country.${seg(code)}`, 'k.geo.country', [
      ['name', name], ['code', code], ['formal', p.FORMAL_EN ? text(p.FORMAL_EN) : undefined],
      ...[...new Set(caps)].map((x) => ['capital', x]),
      ['continent', continent], ['region', p.SUBREGION && !/^Seven seas/.test(p.SUBREGION) ? p.SUBREGION : undefined],
      ['population', p.POP_EST > 0 ? Math.round(p.POP_EST) : undefined],
      ['independent', p.TYPE === 'Sovereign country' || p.TYPE === 'Country'],
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
  const LIST_CODE = { UNK: 'KOS', PSE: 'PSX', SSD: 'SDS', ESH: 'SAH' }; // the list's code -> Natural Earth's
  const neCode = (c) => (byCode.has(c) ? c : LIST_CODE[c]);
  for (const c of [...countries].sort((a, b) => byText(a.cca3, b.cca3))) {
    const code = neCode(c.cca3);
    if (!code || !byCode.has(code)) continue;
    const { name, continent } = byCode.get(code);
    shards.get(continent).borders.push({ name, line: w(`k.geo.borders.${seg(code)}`, 'k.geo.country', [
      ['name', name],
      ...[...new Set(c.borders.map(neCode).map(nameOf).filter(Boolean))].sort(byText).map((n) => ['neighbour', n]),
      ['area', c.area > 0 ? r2(c.area) : undefined], ['landlocked', c.landlocked === true],
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
    const capital = (p) => p.featurecla === 'Admin-0 capital' || p.featurecla === 'Admin-0 capital alt';
    const seen = new Set();
    const kept = [];
    list.forEach((p, i) => {
      if (seen.has(p.name) || !(i < citiesPerCountry || capital(p))) return;
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

  const files = {};
  for (const continent of CONTINENTS) {
    const s = shards.get(continent);
    const name = shardName(continent);
    const body = [
      w(`k.geo.continent.${seg(name)}`, 'k.geo.continent', [['name', continent]], sources(NE)),
      ...s.countries, ...s.cities, ...s.rivers, ...s.mountains, ...s.ranges, ...s.words,
    ];
    files[`${name}.sop`] = `${header({
      id: `k.geo/shards/${name}`,
      about: `${continent}: ${s.countries.length} countries and territories, ${s.cities.length} cities, ${s.rivers.length} rivers, ${s.mountains.length} mountains, ${s.ranges.length} mountain ranges.`,
      sources: ['natural-earth 5.1.2 (Natural Earth, public domain)'],
      license: 'public-domain',
      script: 'tools/import/geo.mjs',
    })}\n${body.join('\n')}\n`;
    if (!s.borders.length) continue;
    files[`${name}-borders.sop`] = `${header({
      id: `k.geo/shards/${name}-borders`,
      about: `${continent}: the neighbours, the area in square kilometres and whether it is landlocked, for ${s.borders.length} countries and territories. Tell it with the shard ${name}: the facts of one country merge.`,
      sources: ['countries 5.1.0 (mledoze/countries, ODbL-1.0)'],
      license: 'ODbL-1.0',
      script: 'tools/import/geo.mjs',
    })}\n${s.borders.sort((a, b) => byText(a.name, b.name)).map((x) => x.line).join('\n')}\n`;
  }
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
  });
  writeShards(arg('out', join(repo, 'docs/worlds/k.geo/shards')), files);
  console.log(JSON.stringify(stats));
}
