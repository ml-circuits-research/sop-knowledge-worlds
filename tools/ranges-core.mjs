// k.attributes typical ranges and typicality (block 15:15 item 3, 14:15 item 2, 17:05).
// (1) `k.attributes.range`: the typical range of a number for things of a kind, so that "a number far from the
//     usual" can be computed (k.interest's range_distance). Computed from the catalog's own numbers where a kind has
//     at least MIN of them: the interquartile range (the quartile rule of tests/k.interest.test.mjs: the value at
//     floor(p * (n - 1)) of the sorted numbers) and the median; written by hand from a published source where the
//     catalog has no numbers (the height of a person, of a house), or as an own choice where nothing measures it
//     (the seats of a table). A sourced range of a kind takes the place of a computed one of the same kind and key.
// (2) `k.attributes.typical`: how usual it is that a thing of a kind has (and a request names) a value for an
//     attribute, a weight in (0, 1], own choice by hand, for a sampler that names sensible attributes.
//   node tools/ranges-core.mjs     writes k.attributes/shards/ranges.sop, ranges-odbl.sop, typical.sop
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from './sopworld/sopworld.mjs';
import { scanWorlds, readHeader, WORLDS_DIR, REPO } from './lib/worlds.mjs';

export const MIN = 8;
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const one = (w, k) => tok(w.attrs[k]?.[0]);
const q = (s) => (/^[a-z][\w.]*$/.test(String(s)) ? String(s) : JSON.stringify(String(s)));
const num = (x) => { const r = Number(x.toPrecision(3)); return String(r); };
export const quartiles = (xs) => { const s = [...xs].sort((a, b) => a - b); const at = (p) => s[Math.floor(p * (s.length - 1))]; return { low: at(0.25), median: at(0.5), high: at(0.75) }; };

// Ranges written by hand: [type, key, kind, low, high, basis, cite, own].
export const HAND = [
  ['k.attributes.number', 'size_about', 'man', 1.6, 1.83, 'source', 'NCD Risk Factor Collaboration (2016), A century of trends in adult human height, eLife 5:e13410, doi:10.7554/eLife.13410',
    'The ends are the lowest and highest national means of adult men born in 1996 in the source, rounded to a centimetre.'],
  ['k.attributes.number', 'size_about', 'woman', 1.5, 1.7, 'source', 'NCD Risk Factor Collaboration (2016), A century of trends in adult human height, eLife 5:e13410, doi:10.7554/eLife.13410',
    'The ends are the lowest and highest national means of adult women born in 1996 in the source, rounded.'],
  ['k.attributes.number', 'size_about', 'person', 1.5, 1.83, 'source', 'NCD Risk Factor Collaboration (2016), A century of trends in adult human height, eLife 5:e13410, doi:10.7554/eLife.13410',
    'Men and women together: the lowest national mean of women to the highest of men.'],
  ['k.attributes.number', 'size_about', 'baby', 0.5, 0.75, 'source', 'WHO Multicentre Growth Reference Study Group (2006), WHO Child Growth Standards: length/height-for-age, World Health Organization',
    'From the median length at birth to the median at one year, rounded.'],
  ['k.attributes.number', 'size_about', 'child', 0.85, 1.5, 'source', 'WHO Multicentre Growth Reference Study Group (2006), WHO Child Growth Standards; de Onis et al. (2007), Bull. World Health Organ. 85:660-667',
    'From the median height at two years to the median at twelve, rounded; boy and girl take the same range.'],
  ['k.attributes.number', 'size_about', 'boy', 0.85, 1.5, 'source', 'WHO Multicentre Growth Reference Study Group (2006); de Onis et al. (2007), Bull. World Health Organ. 85:660-667', 'As child.'],
  ['k.attributes.number', 'size_about', 'girl', 0.85, 1.5, 'source', 'WHO Multicentre Growth Reference Study Group (2006); de Onis et al. (2007), Bull. World Health Organ. 85:660-667', 'As child.'],
  ['k.attributes.number', 'size_about', 'house', 5, 12, 'own', 'CTBUH Height Calculator: a residential storey is about 3.1 m floor to floor',
    'One to three storeys of about 3.1 m and a roof; own choice from the storey height.'],
  ['k.attributes.number', 'size_about', 'skyscraper', 150, 350, 'own', 'CTBUH Height Criteria: a tall building from about 50 m or 14 storeys, supertall from 300 m',
    'Own choice: most buildings called skyscrapers lie between 150 m and supertall; the source defines the classes, not this range.'],
  ['w.seating.table', 'seats', null, 4, 10, 'own', null, 'A family table seats four to six, a banquet table eight to ten; own choice.'],
  ['w.list.item', 'quantity', null, 1, 6, 'own', null, 'A shopping or packing list asks for one to a few of a thing; own choice.'],
];

// Typicality, own choice: [of (a k.attributes.kind name or a type), attribute (or key), weight].
export const TYPICAL = [
  // kinds of common things (k.attributes.kind): their attributes, the most named first
  ['animal', 'colour', 0.9], ['animal', 'size', 0.9], ['animal', 'legs', 0.6], ['animal', 'eats', 0.7], ['animal', 'lives', 0.7], ['animal', 'sound', 0.6], ['animal', 'can', 0.6], ['animal', 'weight', 0.5], ['animal', 'speed', 0.4], ['animal', 'covering', 0.4],
  ['person', 'size', 0.6], ['person', 'age', 0.8], ['person', 'colour', 0.7], ['person', 'parts', 0.5], ['person', 'can', 0.4],
  ['plant', 'colour', 1], ['plant', 'size', 0.8], ['plant', 'place', 0.5], ['plant', 'parts', 0.5],
  ['food', 'colour', 0.8], ['food', 'kind', 0.6], ['food', 'size', 0.4], ['food', 'price', 0.4], ['food', 'weight', 0.3],
  ['drink', 'colour', 1],
  ['vehicle', 'colour', 1], ['vehicle', 'size', 0.8], ['vehicle', 'wheels', 0.7], ['vehicle', 'speed', 0.7], ['vehicle', 'parts', 0.5], ['vehicle', 'price', 0.4], ['vehicle', 'weight', 0.3], ['vehicle', 'material', 0.3],
  ['building', 'size', 1], ['building', 'parts', 0.8], ['building', 'material', 0.5], ['building', 'used_for', 0.5], ['building', 'place', 0.3],
  ['furniture', 'colour', 0.8], ['furniture', 'size', 0.8], ['furniture', 'legs', 0.6], ['furniture', 'material', 0.6], ['furniture', 'place', 0.4], ['furniture', 'used_for', 0.4],
  ['clothing', 'colour', 1], ['clothing', 'size', 0.7], ['clothing', 'material', 0.6], ['clothing', 'price', 0.3],
  ['place', 'size', 0.8], ['place', 'colour', 0.5], ['place', 'used_for', 0.6],
  ['landform', 'size', 1], ['landform', 'colour', 0.5], ['landform', 'material', 0.4],
  ['sky', 'colour', 1], ['sky', 'size', 0.5],
  ['tool', 'used_for', 1], ['tool', 'size', 0.6], ['tool', 'material', 0.5], ['tool', 'weight', 0.3],
  ['toy', 'colour', 1], ['toy', 'size', 0.7], ['toy', 'material', 0.4],
  ['instrument', 'size', 0.6], ['instrument', 'colour', 0.5], ['instrument', 'material', 0.5], ['instrument', 'parts', 0.5],
  ['container', 'size', 1], ['container', 'material', 0.7], ['container', 'used_for', 0.5],
  ['device', 'size', 0.7], ['device', 'used_for', 0.8], ['device', 'price', 0.5],
  ['appliance', 'size', 0.7], ['appliance', 'used_for', 0.8], ['appliance', 'price', 0.4],
  // world schemas: the slots a sampler names first
  ['w.seating.table', 'seats', 1], ['w.seating.table', 'shape', 0.6], ['w.seating.table', 'name', 0.5], ['w.seating.table', 'x', 0.1], ['w.seating.table', 'y', 0.1],
  ['w.seating.guest', 'seat', 1], ['w.seating.guest', 'name', 0.9], ['w.seating.guest', 'party', 0.4], ['w.seating.guest', 'needs', 0.3], ['w.seating.guest', 'note', 0.1],
  ['w.seating.seat', 'table', 1], ['w.seating.seat', 'n', 0.5],
  ['w.map.place', 'highlight', 1], ['w.map.place', 'colour', 0.8], ['w.map.place', 'name', 0.6], ['w.map.place', 'sort', 0.2],
  ['w.map.pin', 'on', 1], ['w.map.pin', 'label', 0.7], ['w.map.pin', 'colour', 0.6], ['w.map.pin', 'sort', 0.2],
  ['w.map.view', 'zoom', 1], ['w.map.view', 'centre', 0.6], ['w.map.view', 'layer', 0.5],
  ['w.list.item', 'text', 1], ['w.list.item', 'done', 0.8], ['w.list.item', 'quantity', 0.7], ['w.list.item', 'note', 0.2], ['w.list.item', 'n', 0.2],
  ['w.list.list', 'name', 1], ['w.list.list', 'about', 0.4],
  ['w.timeline.event', 'title', 1], ['w.timeline.event', 'at', 1], ['w.timeline.event', 'until', 0.5], ['w.timeline.event', 'about', 0.3], ['w.timeline.event', 'sort', 0.3], ['w.timeline.event', 'certain', 0.1],
  ['w.timeline.timeline', 'name', 1], ['w.timeline.timeline', 'from', 0.6], ['w.timeline.timeline', 'to', 0.6], ['w.timeline.timeline', 'unit', 0.4],
  ['w.face.face', 'expression', 1], ['w.face.face', 'hair_colour', 0.8], ['w.face.face', 'eye_colour', 0.5], ['w.face.face', 'skin', 0.5], ['w.face.face', 'clothes', 0.5], ['w.face.face', 'style', 0.3],
  ['w.face.part', 'variant', 1], ['w.face.part', 'colour', 0.7], ['w.face.part', 'size', 0.5], ['w.face.part', 'x', 0.1], ['w.face.part', 'y', 0.1],
  // places of the map (k.geo): the keys a question or a highlight names first
  ['k.geo.country', 'capital', 1], ['k.geo.country', 'population', 0.9], ['k.geo.country', 'continent', 0.8], ['k.geo.country', 'area', 0.7], ['k.geo.country', 'language', 0.6], ['k.geo.country', 'currency', 0.5], ['k.geo.country', 'neighbour', 0.5], ['k.geo.country', 'landlocked', 0.3],
  ['k.geo.city', 'country', 1], ['k.geo.city', 'population', 0.8], ['k.geo.city', 'capital_of', 0.6],
  ['k.geo.river', 'length_about', 0.9], ['k.geo.river', 'country', 0.7],
  ['k.geo.mountain', 'elevation', 1], ['k.geo.mountain', 'country', 0.6],
  ['k.geo.lake', 'area_about', 0.8],
];


// Wikidata's typical numbers (sources/wikidata-typical, CC0): [file, type, key, kind, unit of the key, about the
// population]. One value per item (the median of its statements), units converted; ranges with basis=source.
export const WIKIDATA_RAW = join(REPO, 'sources/wikidata-typical/raw');
export const WIKIDATA = [
  ['animals-mass.csv', 'k.attributes.number', 'weight_about', 'animal', 'kilogram', 'taxa (species) with a mass in Wikidata'],
  ['animals-length.csv', 'k.attributes.number', 'size_about', 'animal', 'metre', 'taxa (species) with a length in Wikidata'],
  ['buildings-height.csv', 'k.attributes.number', 'size_about', 'building', 'metre', 'buildings with a height in Wikidata'],
  ['countries-area.csv', 'k.geo.country', 'area', null, 'square kilometre', 'countries with an area in Wikidata'],
];
const TO = { kilogram: { gram: 0.001, kilogram: 1 }, metre: { metre: 1, millimetre: 0.001, centimetre: 0.01, foot: 0.3048, inch: 0.0254 },
  'square kilometre': { 'square kilometre': 1, hectare: 0.01, 'square metre': 1e-6, 'square mile': 2.58999 } };
export function wikidata(dir = WIKIDATA_RAW) {
  if (!existsSync(join(dir, WIKIDATA[0][0]))) return null;
  return WIKIDATA.map(([file, type, key, kind, unit, about]) => {
    const rows = readFileSync(join(dir, file), 'utf8').replace(/\r/g, '').trim().split('\n').slice(1);
    const by = new Map();
    let read = 0, left = 0;
    for (const line of rows) {
      const m = /^(Q\d+),.*,(-?[\d.]+(?:e[+-]?\d+)?),([^,]*)$/.exec(line);
      if (!m) { left++; continue; }
      read++;
      const f = TO[unit][m[3]];
      if (f === undefined || !(Number(m[2]) > 0)) { left++; continue; }
      (by.get(m[1]) ?? by.set(m[1], []).get(m[1])).push(Number(m[2]) * f);
    }
    const xs = [...by.values()].map((a) => a.sort((x, y) => x - y)[Math.floor((a.length - 1) / 2)]);
    return { type, key, kind, about, file, rows: read, left, count: xs.length, ...quartiles(xs) };
  });
}

// The groups computed from the catalog: [type, key, kind of the group (null: all facts of the type), filter].
export function computed(worlds = scanWorlds()) {
  const wires = (id) => worlds.find((w) => w.id === id).shards.flatMap((s) => parse(s.text).map((w) => ({ ...w, license: readHeader(s.text).license?.[0] })));
  const attrs = wires('k.attributes');
  const kindOf = new Map(attrs.filter((w) => w.type === 'k.attributes.thing' && one(w, 'kind')).map((w) => [`${one(w, 'name')} ${one(w, 'sense') ?? ''}`, one(w, 'kind')]));
  const classOf = new Map(wires('k.animals').filter((w) => w.type === 'k.animals.animal' && one(w, 'class')).flatMap((w) => [[one(w, 'name'), one(w, 'class')], ...(one(w, 'thing') ? [[one(w, 'thing'), one(w, 'class')]] : [])]));
  const groups = new Map();
  const add = (type, key, kind, x, src, license) => {
    const id = `${type}|${key}|${kind ?? ''}`;
    const g = groups.get(id) ?? groups.set(id, { type, key, kind, xs: [], sources: new Set(), licenses: new Set() }).get(id);
    g.xs.push(x); g.sources.add(src); g.licenses.add(license);
  };
  const isNum = (v) => v !== undefined && /^-?\d+(\.\d+)?(e[+-]?\d+)?$/.test(v);
  for (const w of attrs.filter((x) => x.type === 'k.attributes.number')) for (const key of ['size_about', 'weight_about', 'speed_about']) {
    const v = w.attrs[key]?.[0];
    if (!isNum(v)) continue;
    const kind = kindOf.get(`${one(w, 'name')} ${one(w, 'sense') ?? ''}`) ?? kindOf.get(`${one(w, 'name')} `);
    if (kind) add('k.attributes.number', key, kind, Number(v), 'hand-core 1', 'CC0-1.0');
    const cls = classOf.get(one(w, 'name'));
    if (cls && kind === 'animal') add('k.attributes.number', key, cls, Number(v), 'hand-core 1', 'CC0-1.0');
  }
  for (const w of wires('k.body').filter((x) => x.type === 'k.body.part')) if (isNum(w.attrs.length_about?.[0])) add('k.body.part', 'length_about', null, Number(w.attrs.length_about[0]), 'hand-core 1', 'CC0-1.0');
  const GEO = [['k.geo.country', 'population'], ['k.geo.country', 'area'], ['k.geo.city', 'population'], ['k.geo.mountain', 'elevation'], ['k.geo.river', 'length_about'], ['k.geo.lake', 'area_about'], ['k.geo.sea', 'area_about'], ['k.geo.desert', 'area_about']];
  for (const w of wires('k.geo')) for (const [type, key] of GEO) {
    if (w.type !== type || !isNum(w.attrs[key]?.[0])) continue;
    const srcs = (w.attrs['core.source'] ?? []).map(tok);
    if (srcs.some((s) => s.startsWith('geonames'))) continue; // a city population of GeoNames (CC BY): the public-domain ones are enough
    add(type, key, null, Number(w.attrs[key][0]), srcs.find((s) => !s.startsWith('psys2-worlds')) ?? srcs[0], w.license);
  }
  return [...groups.values()].filter((g) => g.xs.length >= MIN).map((g) => ({ ...g, ...quartiles(g.xs), count: g.xs.length }))
    .filter((g) => g.high > g.low).sort((a, b) => `${a.type} ${a.key} ${a.kind ?? ''}`.localeCompare(`${b.type} ${b.key} ${b.kind ?? ''}`));
}

const header = (name, about, sources, license) => [
  `# k.attributes/shards/${name}: ${about}`,
  `# sources: ${sources}`,
  `# license: ${license}`,
  '# script: tools/ranges-core.mjs',
  '',
];

export function shards(worlds = scanWorlds()) {
  const hand = new Set(HAND.map(([t, k, kind]) => `${t}|${k}|${kind ?? ''}`));
  const comp = computed(worlds).filter((g) => !hand.has(`${g.type}|${g.key}|${g.kind ?? ''}`));
  const idOf = (type, key, kind) => `@k.attributes.range.${type}.${key}${kind ? `.${String(kind).replace(/[^a-z0-9]+/g, '_')}` : ''}`;
  const line = (g) => `${idOf(g.type, g.key, g.kind)} k.attributes.range type=${g.type} key=${g.key}${g.kind ? ` kind=${q(g.kind)}` : ''} low=${num(g.low)} high=${num(g.high)} median=${num(g.median)} count=${g.count} basis=catalog core.source=${[...g.sources].sort().map((s) => JSON.stringify(s)).join(' core.source=')}`;
  const open = comp.filter((g) => [...g.licenses].every((l) => ['CC0-1.0', 'public-domain'].includes(l)));
  const odbl = comp.filter((g) => [...g.licenses].includes('ODbL-1.0'));
  const ranges = [...header('ranges', 'the typical range of a number for things of a kind (block 15:15 item 3): the interquartile range and median of the catalog\'s numbers of the kind, and ranges from published sources or own choice where the catalog has none.',
    'hand-core 1 (the numbers of k.attributes, k.body and k.geo computed into ranges here, and the hand ranges with the works they cite); natural-earth 5.1.2 (Natural Earth, public domain: populations, elevations, lake areas)', 'CC0-1.0'),
  '# ---- computed from the catalog (basis=catalog) ----', ...open.map(line), '', '# ---- by hand (basis=source: a published work; basis=own: own choice) ----',
  ...HAND.map(([t, k, kind, low, high, basis, cite, own]) => `${idOf(t, k, kind)} k.attributes.range type=${t} key=${k}${kind ? ` kind=${q(kind)}` : ''} low=${low} high=${high} basis=${basis}${cite ? ` cite=${JSON.stringify(cite)}` : ''} own=${JSON.stringify(own)} core.source="hand-core 1"`)];
  const odblShard = [...header('ranges-odbl', 'typical ranges computed from numbers under the Open Database License (country areas of mledoze/countries), kept in a shard of their own licence.',
    'countries 5.1.0 (mledoze/countries, ODbL-1.0)', 'ODbL-1.0'), ...odbl.map(line)];
  const typical = [...header('typical', 'how usual it is that a thing of a kind has, and a request names, a value for an attribute (block 14:15 item 2): a weight in (0, 1], own choice, for a sampler that names sensible attributes.',
    'hand-core 1 (own choice, written in this repository)', 'CC0-1.0'),
  ...TYPICAL.map(([of, a, w]) => `@k.attributes.typical.${of.replace(/[^a-z0-9.]+/g, '_')}.${a} k.attributes.typical of=${q(of)} attribute=${a} weight=${w} core.source="hand-core 1"`)];
  const out = { 'ranges.sop': `${ranges.join('\n')}\n`, 'ranges-odbl.sop': `${odblShard.join('\n')}\n`, 'typical.sop': `${typical.join('\n')}\n` };
  const wd = wikidata();
  if (wd) out['ranges-wikidata.sop'] = `${[...header('ranges-wikidata', 'typical ranges of numbers measured in Wikidata (basis=source): the interquartile range and median of one value per item (the median of its statements, units converted); a population of items that carry the number, not of everyday things (most described species are small).',
    'wikidata-typical 2026-11-14 (Wikidata, CC0, fetched through PSys2 into data/external/wikidata-typical-numbers)', 'CC0-1.0'),
  ...wd.map((g) => `${idOf(g.type, g.key, g.kind)}.wikidata k.attributes.range type=${g.type} key=${g.key}${g.kind ? ` kind=${q(g.kind)}` : ''} low=${num(g.low)} high=${num(g.high)} median=${num(g.median)} count=${g.count} basis=source cite=${JSON.stringify(`Wikidata (CC0), ${g.file}: ${g.about}`)} own=${JSON.stringify(`One value per item, the median of its statements; ${g.rows} rows read, ${g.left} without a usable unit or value.`)} core.source="wikidata-typical 2026-11-14"`)].join('\n')}\n`;
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (!wikidata()) console.log('sources/wikidata-typical/raw is missing: ranges-wikidata.sop is left as it is');
  for (const [f, text] of Object.entries(shards())) { writeFileSync(join(WORLDS_DIR, 'k.attributes/shards', f), text); console.log(f, text.split('\n').filter((l) => l.startsWith('@')).length, 'wires', Buffer.byteLength(text), 'bytes'); }
}
