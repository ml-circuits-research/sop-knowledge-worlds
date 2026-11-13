// Mulberry Symbols (pictograms for communication aids) -> k.objects shards, for the things that no earlier source
// has (hand-written, Noto Emoji, OpenMoji). Same conversion and part names file format. Deterministic.
//   node tools/import/mulberry.mjs [--raw sources/mulberry/raw/repo] [--names sources/mulberry/part-names.tsv]
//                                  [--out docs/worlds/k.objects/shards]
// How to fetch: sources/mulberry/SOURCE.md.
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { objectShards, takenNames, writeObjectShards } from './objects.mjs';

export const SOURCE = 'mulberry fa94a93';
export const PREFIX = 'mulberry-';
// The categories of things (nouns only): animals, buildings and their contents, clothes, food, tools, toys, transport.
const CATEGORIES = /^(Animal (Birds|Crustacean and Molluscs|Fish and Marine mammals|Mammal|Other Invertebrates|Reptiles and Amphibians|Spiders and Insects)|Art Making|Building (Contents|Equipment and devices|Furniture|Garden and farm|Public|Residential|School|Shop|Structure)|Celebration Item|Clothes .*|Drink (Containers and measures|Type)|Electrical .*|Food (Breads and baking|Dairy|Eggs|Fish and seafood|Fruit|Ingredients|Kitchen items|Meals and snacks|Meat|Nuts|Pastas and rice|Poultry|Sweets and desserts|Vegetables and salads?)|Healthcare (Grooming items|Medical items)|Holiday and travel|Leisure (Games|Playground|Toys)|Money|Music Instrument|Plants and Trees|Science|Science Astronomy|Sport Accessories|Tools (Garden|Workshop)|Transport .*|Work and School Stationery)$/;

// One line of a CSV with quoted fields.
const csvLine = (line) => { const out = []; let cur = '', q = false; for (const c of line) { if (c === '"') q = !q; else if (c === ',' && !q) { out.push(cur); cur = ''; } else cur += c; } out.push(cur); return out; };

// info: the text of scripts/data/symbol-info.csv; svg: (file name without .svg) => text or null.
export function importMulberry({ info, svg, partNames = '', taken = new Set() }) {
  const skipped = { notThing: 0, variant: 0, taken: 0, noSvg: 0 };
  const rows = info.replace(/^﻿/, '').split('\n').filter((l) => l.trim()).map(csvLine);
  const col = Object.fromEntries(rows[0].map((h, i) => [h.trim(), i]));
  const seen = new Set();
  const entries = [];
  for (const r of rows.slice(1)) {
    const file = (r[col['symbol-en']] ?? '').trim();
    const category = (r[col['category-en']] ?? '').trim();
    if (!file || r[col.grammar]?.trim() !== 'Noun' || !CATEGORIES.test(category) || file.includes(',')) { skipped.notThing++; continue; }
    // A second or third drawing of one thing (apple_2, baker_1a) is left out; the first is kept.
    if (/_\d+[a-z]?$/.test(file)) { skipped.variant++; continue; }
    const name = file.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
    if (taken.has(name.toLowerCase()) || seen.has(name.toLowerCase())) { skipped.taken++; continue; }
    const source = svg(file);
    if (!source) { skipped.noSvg++; continue; }
    seen.add(name.toLowerCase());
    entries.push({ uid: `mb${r[col['symbol-id']].trim()}`, name, keywords: (r[col.tags] ?? '').split(/\s+/), group: category, svg: source });
  }
  entries.sort((a, b) => (a.group < b.group ? -1 : a.group > b.group ? 1 : a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  const { files, stats } = objectShards(entries, {
    prefix: PREFIX, drawings: SOURCE, names: SOURCE,
    sources: ['mulberry fa94a93 (Mulberry Symbols, the drawings, their names and tags, CC-BY-SA-4.0)'],
    license: 'CC-BY-SA-4.0', script: 'tools/import/mulberry.mjs',
    about: 'Parts converted from the Mulberry Symbols drawings: a primitive shape, a box in the 0 to 100 frame, a draw order z, a colour name and the exact colour; points for polygons and lines.',
  }, { partNames, convert: { hollow: 0.3 } });
  return { files, stats: { ...stats, skipped } };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const arg = (name, dflt) => { const i = process.argv.indexOf(`--${name}`); return i < 0 ? dflt : process.argv[i + 1]; };
  const raw = arg('raw', join(repo, 'sources/mulberry/raw/repo'));
  const namesFile = arg('names', join(repo, 'sources/mulberry/part-names.tsv'));
  const out = arg('out', join(repo, 'docs/worlds/k.objects/shards'));
  const { files, stats } = importMulberry({
    info: readFileSync(join(raw, 'scripts/data/symbol-info.csv'), 'utf8'),
    svg: (file) => { const p = join(raw, 'EN', `${file}.svg`); return existsSync(p) ? readFileSync(p, 'utf8') : null; },
    partNames: existsSync(namesFile) ? readFileSync(namesFile, 'utf8') : '',
    taken: takenNames(out, PREFIX),
  });
  writeObjectShards(out, PREFIX, files);
  console.log(JSON.stringify(stats));
}
