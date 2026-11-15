// Islands (Wikidata, CC0) and geographic regions (Natural Earth, public domain) -> k.geo shards, so that a map can
// place "Tenerife" or "Patagonia". psys2 real turn T43 (reviewer block 13:10 of psys2's worker-tasks.md). No
// geometry beyond a centre point (and a box for a region). Deterministic.
// Not imported: first-level administrative divisions. Natural Earth 5.1.2's admin-1 failed the KR6 sample (3 of 35
// out of date: Kenya's provinces of before 2013, Latvia's municipalities of before 2021, Burundi's provinces of
// before 2025); Wikidata's P150 lists were no cleaner (France: Lorraine still listed, five regions missing; a river
// listed as a division of the Central African Republic).
//   node tools/import/geo-places.mjs [--wd sources/wikidata-islands/raw/islands.json]
//                                    [--ne sources/natural-earth/raw/ne_10m_geography_regions_polys.geojson]
//                                    [--out docs/worlds/k.geo/shards]
// How to fetch the raw files: sources/wikidata-islands/SOURCE.md and sources/natural-earth/SOURCE.md.
// The countries are those of the k.geo shards already written (by code): a country Wikidata or Natural Earth names
// and k.geo lacks is left out of the fact (the island stays, without that country).
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { byText, seg, wire, header, writeShards } from './lib.mjs';

export const WD = 'wikidata-islands 2026-11-15';
export const NE = 'natural-earth 5.1.2';
const r2 = (n) => String(Math.round(n * 100) / 100);
const shardName = (continent) => continent.toLowerCase().split(' ').join('-');

// Corrections from the hand-checked sample (KR6): Wikidata item -> what is wrong there and what is right.
// `country`: the country codes to use instead of Wikidata's P17.
// `area: null`: Wikidata's area is wrong, none is said; `archipelago`: the archipelagos to use instead.
export const ISLAND_FIXES = {
  Q193896: { country: ['MLT'] }, // Malta, the island: Wikidata's P17 gave Italy (2026-11-15)
  Q23994125: { area: null }, // Illas Ons (Spain) is about 4.3 km², not 4,458
  Q13280: { archipelago: [] }, // Cres lies in the Kvarner Gulf, not in the Dalmatian archipelago
};
// `area` is said only from AREA_MIN square kilometres: of the smaller islands of the samples, 4 in 62 had a wrong
// area (the municipality's: Mykonos 106 for 86, Cozumel 539 for 478; Taboga 121 for 6; Sabuniyah), more than KR6
// allows; of the larger ones 1 in 53 (Illas Ons, corrected). See sources/wikidata-islands/SOURCE.md.
export const AREA_MIN = 1000;
// A name that ends in Islands or Archipelago is a group of islands that Wikidata calls an island (Tyuleniy
// Archipelago, Samarai Islands): left out.
export const GROUP_NAME = /\b(Islands|Archipelago)$/;

// k.geo's countries: code -> { name, continent }, read from the shards the geo importer wrote.
export function countriesOf(dir) {
  const out = new Map();
  for (const f of readdirSync(dir).sort()) {
    if (!f.endsWith('.sop') || f.startsWith('islands') || f.startsWith('regions')) continue;
    for (const line of readFileSync(join(dir, f), 'utf8').split('\n')) {
      if (!/^@\S+ k\.geo\.country /.test(line)) continue;
      const code = line.match(/ code=(\S+)/)?.[1];
      const continent = line.match(/ continent=("[^"]*"|\S+)/)?.[1];
      const name = line.match(/ name=("[^"]*"|\S+)/)?.[1];
      if (!code || !name) continue;
      const un = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
      const had = out.get(code) ?? {};
      out.set(code, { name: un(name), continent: had.continent ?? un(continent) });
    }
  }
  return out;
}

const point = (wkt) => {
  const m = /^Point\(([-0-9.eE]+) ([-0-9.eE]+)\)$/.exec(wkt ?? '');
  return m ? { lon: Number(m[1]), lat: Number(m[2]) } : undefined;
};
const qid = (uri) => uri.replace(/^.*\//, '');
const qnum = (q) => Number(q.slice(1));

// Islands: one fact per English name (the largest island of that name; two of one name are told apart by nothing a
// map reader says). `area` in square kilometres (the smallest of Wikidata's statements: the island alone, not with
// its islets); `country` (many) the countries Wikidata gives (P17, those k.geo knows); `archipelago` (many) the
// archipelagos it is part of (P361 whose item is an archipelago).
export function islands(json, countries) {
  const items = new Map();
  for (const b of json.results.bindings) {
    const q = qid(b.island.value);
    const label = b.islandLabel?.value ?? '';
    if (!label || /^Q[0-9]+$/.test(label) || GROUP_NAME.test(label.trim())) continue;
    const it = items.get(q) ?? { q, name: label.replace(/\s+/g, ' ').trim(), points: new Set(), areas: new Set(), codes: new Set(), archs: new Set() };
    if (b.coord) it.points.add(b.coord.value);
    if (b.areaM2) it.areas.add(Number(b.areaM2.value));
    if (b.iso3) it.codes.add(b.iso3.value);
    if (b.archLabel && !/^Q[0-9]+$/.test(b.archLabel.value)) it.archs.add(b.archLabel.value.replace(/\s+/g, ' ').trim());
    items.set(q, it);
  }
  const best = new Map();
  for (const it of [...items.values()].sort((a, b) => qnum(a.q) - qnum(b.q))) {
    const pts = [...it.points].map(point).filter(Boolean).sort((a, b) => a.lat - b.lat || a.lon - b.lon);
    if (!pts.length) continue;
    const areas = [...it.areas].filter((a) => a > 0);
    const fix = ISLAND_FIXES[it.q] ?? {};
    const km2 = fix.area === null || !areas.length ? undefined : Math.min(...areas) / 1e6;
    const codes = (fix.country ?? [...it.codes]).filter((c) => countries.has(c)).sort(byText);
    const isl = { q: it.q, name: it.name, lat: pts[0].lat, lon: pts[0].lon, area: km2, countries: codes.map((c) => countries.get(c).name).sort(byText), continent: codes.length ? countries.get(codes[0]).continent : undefined, archipelagos: (fix.archipelago ?? [...it.archs]).filter((a) => a !== it.name).sort(byText) };
    if (isl.area !== undefined && isl.area < AREA_MIN) { isl.size = isl.area; isl.area = undefined; }
    if (!isl.continent) isl.continent = isl.lat < -55 ? 'Antarctica' : undefined;
    const had = best.get(isl.name);
    const size = (i) => i.area ?? i.size ?? 0;
    if (!had || size(isl) > size(had)) best.set(isl.name, isl);
  }
  return [...best.values()].sort((a, b) => byText(a.name, b.name));
}

const roundArea = (a) => String(Math.round(a));

export function islandShards(list) {
  const by = new Map();
  for (const i of list) {
    const key = i.continent ? shardName(i.continent) : 'other';
    if (!by.has(key)) by.set(key, []);
    by.get(key).push(wire(`k.geo.island.${seg(i.name)}`, 'k.geo.island', [['name', i.name], ...i.countries.map((c) => ['country', c]), ...i.archipelagos.map((a) => ['archipelago', a]), ['area', i.area === undefined ? undefined : roundArea(i.area)], ['lat', r2(i.lat)], ['lon', r2(i.lon)], ['wikidata', i.q]], WD));
  }
  const files = {};
  for (const key of [...by.keys()].sort(byText)) {
    const lines = by.get(key);
    files[`islands-${key}.sop`] = header({ id: `k.geo/shards/islands-${key}`, about: `${lines.length} islands${key === 'other' ? ' of no country k.geo knows' : ` (by the continent of their country)`}: name, country, archipelago, area (km²), centre, Wikidata item.`, sources: ['wikidata-islands 2026-11-15 (Wikidata, CC0-1.0)'], license: 'CC0-1.0', script: 'tools/import/geo-places.mjs' }) + '\n' + lines.join('\n') + '\n';
  }
  return files;
}

// Geographic regions (Natural Earth's `Geoarea` polygons: Siberia, Patagonia, Normandy, Lapland, the lands of
// Greenland and Antarctica): name, continent, centre and box of the outline, Wikidata item where Natural Earth gives
// one. The whole set (43) was checked by hand; REGION_FIXES are its corrections.
export const REGION_FIXES = {
  'Knud Ramussen Land': { name: 'Knud Rasmussen Land' }, // misspelt in NAME_EN (NAME has it right)
  'Mac. Robertson Land': { name: 'MacRobertson Land' }, // NAME_EN abbreviates; NAME has it right
  Anatolia: { continent: 'Asia' }, // Natural Earth files it under Europe
};
export function regions(geojson) {
  const by = new Map();
  for (const f of geojson.features) {
    const p = f.properties;
    if (p.FEATURECLA !== 'Geoarea') continue;
    const raw = (p.NAME_EN || p.NAME || '').replace(/\s+/g, ' ').trim();
    if (!raw) continue;
    const fix = REGION_FIXES[raw] ?? {};
    const name = fix.name ?? raw;
    const g = f.geometry;
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
    const points = polys.flatMap((poly) => poly[0]);
    const had = by.get(name);
    if (had) { had.points.push(...points); continue; }
    by.set(name, { name, continent: fix.continent ?? p.REGION, q: p.WIKIDATAID || undefined, points });
  }
  return [...by.values()].sort((a, b) => byText(a.name, b.name)).map((r) => {
    let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
    for (const [x, y] of r.points) { if (x < w) w = x; if (x > e) e = x; if (y < s) s = y; if (y > n) n = y; }
    // a region across the 180th meridian (Alaska): the box spans -180 to 180 (as in k.geo's Limits), the centre is
    // worked out with the western longitudes shifted by 360
    let lon = (w + e) / 2;
    if (e - w > 180) {
      let w2 = Infinity, e2 = -Infinity;
      for (const [x] of r.points) { const x2 = x < 0 ? x + 360 : x; if (x2 < w2) w2 = x2; if (x2 > e2) e2 = x2; }
      if (e2 - w2 < 180) { lon = (w2 + e2) / 2; if (lon > 180) lon -= 360; w = -180; e = 180; }
    }
    return { name: r.name, continent: r.continent, q: r.q, lat: (s + n) / 2, lon, west: w, south: s, east: e, north: n };
  });
}

export function regionShard(list) {
  const lines = list.map((r) => wire(`k.geo.region.${seg(r.name)}`, 'k.geo.region', [['name', r.name], ['continent', r.continent], ['lat', r2(r.lat)], ['lon', r2(r.lon)], ['west', r2(r.west)], ['south', r2(r.south)], ['east', r2(r.east)], ['north', r2(r.north)], ['wikidata', r.q]], NE));
  return { 'regions.sop': header({ id: 'k.geo/shards/regions', about: `${lines.length} geographic regions (Natural Earth Geoarea): name, continent, centre, box, Wikidata item.`, sources: ['natural-earth 5.1.2 (Natural Earth, public domain)'], license: 'public-domain', script: 'tools/import/geo-places.mjs' }) + '\n' + lines.join('\n') + '\n' };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : join(root, d); };
  const out = arg('--out', 'docs/worlds/k.geo/shards');
  const countries = countriesOf(out);
  const isl = islands(JSON.parse(readFileSync(arg('--wd', 'sources/wikidata-islands/raw/islands.json'), 'utf8')), countries);
  const reg = regions(JSON.parse(readFileSync(arg('--ne', 'sources/natural-earth/raw/ne_10m_geography_regions_polys.geojson'), 'utf8')));
  writeShards(out, islandShards(isl), 'islands');
  writeShards(out, regionShard(reg), 'regions');
  console.log(`islands ${isl.length} (${isl.filter((i) => i.countries.length).length} with a country, ${isl.filter((i) => i.area !== undefined).length} with an area, ${isl.filter((i) => i.archipelagos.length).length} with an archipelago); regions ${reg.length}`);
}
