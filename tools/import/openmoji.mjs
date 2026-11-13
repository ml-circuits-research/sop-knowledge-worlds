// OpenMoji colour SVGs -> k.objects shards, for the things that no earlier source has (hand-written, Noto Emoji).
// Same conversion and the same part names file format as noto-emoji.mjs. Deterministic.
//   node tools/import/openmoji.mjs [--raw sources/openmoji/raw/repo] [--names sources/openmoji/part-names.tsv]
//                                  [--out docs/worlds/k.objects/shards]
// How to fetch: sources/openmoji/SOURCE.md.
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { objectShards, takenNames, writeObjectShards } from './objects.mjs';

export const SOURCE = 'openmoji 3e01de5';
export const PREFIX = 'openmoji-';
// Groups of things; inside "extras-openmoji" only the subgroups of things.
const GROUPS = new Set(['animals-nature', 'food-drink', 'travel-places', 'activities', 'objects']);
const EXTRAS = new Set(['animals-nature', 'food-drink', 'gardening', 'objects', 'technology', 'travel-places', 'healthcare']);
// Not things: signs, people, actions, complaints, ideas, and drawings only their makers' town knows.
const NOT_THINGS = /o’clock|o'clock|-thirty$| suit$|^joker$|^mahjong red dragon$|^flower playing cards$|^sparkles$|^no |sign$|symbol|logo|icon|arrow|warning|hazard|\b(man|woman|person|male|female|doctor|nurse|worker|explorer|gardener|pain|sneezing|taking|change|eye|waves|hand|wireframes|editor|surveillance|reality|circled|triangle|pointing|jumping|hole|stencil|town|figure|content|low|high|red|under water|in water|ruin|broken|melting|ct scan|code|circuit|transmission|virtual)\b|ache$|schwäbisch|stuttgart|HfG|kehrwoche|hocker|adilette|maultasche|spaetzle|spätzle|HAL 9000|tardis|nessy|ibeacon|arduino|raspberry|crocs|guy fawkes|babylon|rhodes|alexandria|halicarnassus|olympia|ephesus/i;

// data: the parsed data/openmoji.json; svg: (hexcode) => text or null; taken: lower-case names that already exist.
export function importOpenmoji({ data, svg, partNames = '', taken = new Set() }) {
  const skipped = { notThing: 0, taken: 0, noSvg: 0 };
  const seen = new Set();
  const entries = [];
  for (const e of data) {
    const extra = e.group === 'extras-openmoji' || e.group === 'extras-unicode';
    const group = extra ? e.subgroups : e.group;
    if (!(extra ? EXTRAS.has(e.subgroups) || e.subgroups === 'transport-and-map-symbols' : GROUPS.has(e.group)) || e.skintone) continue;
    const name = String(e.annotation ?? '').trim();
    if (!name || NOT_THINGS.test(name)) { skipped.notThing++; continue; }
    if (taken.has(name.toLowerCase()) || seen.has(name.toLowerCase())) { skipped.taken++; continue; }
    const source = svg(e.hexcode);
    if (!source) { skipped.noSvg++; continue; }
    seen.add(name.toLowerCase());
    const keywords = `${e.tags ?? ''},${e.openmoji_tags ?? ''}`.split(',');
    entries.push({ uid: `om${e.hexcode.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`, name, keywords, group, svg: source });
  }
  const { files, stats } = objectShards(entries, {
    prefix: PREFIX, drawings: SOURCE, names: SOURCE,
    sources: ['openmoji 3e01de5 (OpenMoji, the colour SVG drawings and their names, CC-BY-SA-4.0)'],
    license: 'CC-BY-SA-4.0', script: 'tools/import/openmoji.mjs',
    about: 'Parts converted from the OpenMoji drawings: a primitive shape, a box in the 0 to 100 frame, a draw order z, a colour name and the exact colour; points for polygons and lines.',
  }, { partNames, convert: { hollow: 0.3 }, details: true });
  return { files, stats: { ...stats, skipped } };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const arg = (name, dflt) => { const i = process.argv.indexOf(`--${name}`); return i < 0 ? dflt : process.argv[i + 1]; };
  const raw = arg('raw', join(repo, 'sources/openmoji/raw/repo'));
  const namesFile = arg('names', join(repo, 'sources/openmoji/part-names.tsv'));
  const out = arg('out', join(repo, 'docs/worlds/k.objects/shards'));
  const { files, stats } = importOpenmoji({
    data: JSON.parse(readFileSync(join(raw, 'data/openmoji.json'), 'utf8')),
    svg: (hex) => { const p = join(raw, 'color/svg', `${hex}.svg`); return existsSync(p) ? readFileSync(p, 'utf8') : null; },
    partNames: existsSync(namesFile) ? readFileSync(namesFile, 'utf8') : '',
    taken: takenNames(out, PREFIX),
  });
  writeObjectShards(out, PREFIX, files);
  console.log(JSON.stringify(stats));
}
