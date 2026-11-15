// ConceptNet 5.7 -> k.commonsense and k.attributes shards: English edges of weight 2 or more for AtLocation, IsA,
// PartOf and HasA (k.commonsense.thing) and CapableOf, UsedFor and MadeOf (k.attributes.thing: KR1 item 4, the one home
// of what a thing can do, is used for and is made of), one fact per thing and type. NOT RUN in this repository's network (the dump is on S3): a
// machine with an open network downloads the file and runs this script. Deterministic.
//   node tools/import/conceptnet.mjs [--in sources/conceptnet/raw/conceptnet-assertions-5.7.0.csv.gz]
//                                    [--out docs/worlds/k.commonsense/shards] [--min-weight 2]
// How to fetch: sources/conceptnet/SOURCE.md.
import { createReadStream, readdirSync, readFileSync, existsSync } from 'node:fs';
import { createGunzip } from 'node:zlib';
import { createInterface } from 'node:readline';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { byText, seg, wire, header, writeShards, splitParts } from './lib.mjs';

export const SOURCE = 'conceptnet 5.7';
export const PREFIX = 'conceptnet-';
// ConceptNet relation -> the key it becomes; the keys of ATTRIBUTE_KEYS are keys of k.attributes.thing, the others of
// k.commonsense.thing.
export const RELATIONS = { AtLocation: 'at', CapableOf: 'can', UsedFor: 'used_for', MadeOf: 'material', IsA: 'is_a', PartOf: 'part_of', HasA: 'has' };
export const ATTRIBUTE_KEYS = ['can', 'used_for', 'material'];
const KEYS = Object.values(RELATIONS);
const TYPES = [['k.commonsense', 'k.commonsense.thing', 'cn', KEYS.filter((k) => !ATTRIBUTE_KEYS.includes(k)), 'where they are, what they are and what they have or are part of'],
  ['k.attributes', 'k.attributes.thing', 'cn', ATTRIBUTE_KEYS, 'what they can do, what they are used for and what they are made of']];

// "/c/en/ice_cream/n" -> "ice cream"; null when the term is not English.
export const term = (uri) => {
  const m = /^\/c\/en\/([^/]+)/.exec(uri);
  return m ? m[1].replace(/_/g, ' ').trim() : null;
};

// One line of the assertions file -> { name, key, value, weight } or null.
export function readEdge(line, minWeight = 2) {
  const f = line.split('\t');
  if (f.length < 5) return null;
  const key = RELATIONS[f[1].replace(/^\/r\//, '')];
  const name = term(f[2]), value = term(f[3]);
  if (!key || !name || !value || name === value) return null;
  let weight = 0;
  try { weight = JSON.parse(f[4]).weight ?? 0; } catch { return null; }
  return weight >= minWeight ? { name, key, value, weight } : null;
}

// lines: an (async) iterable of lines; taken: lower-case names that hand-written facts of k.commonsense already have,
// takenAttributes: those of k.attributes (they win, per type). Returns the files of k.commonsense (`files`) and of
// k.attributes (`attributeFiles`).
export async function importConceptnet(lines, { minWeight = 2, taken = new Set(), takenAttributes = new Set(), limits } = {}) {
  const things = new Map();
  const stats = { lines: 0, edges: 0, things: 0, values: 0, skippedTaken: 0, shards: 0 };
  for await (const line of lines) {
    stats.lines++;
    const e = readEdge(line, minWeight);
    if (!e) continue;
    stats.edges++;
    if ((ATTRIBUTE_KEYS.includes(e.key) ? takenAttributes : taken).has(e.name.toLowerCase())) { stats.skippedTaken++; continue; }
    if (!things.has(e.name)) things.set(e.name, Object.fromEntries(KEYS.map((k) => [k, new Map()])));
    const values = things.get(e.name)[e.key];
    values.set(e.value, Math.max(values.get(e.value) ?? 0, e.weight));
  }
  const out = {};
  for (const [world, type, idPart, keys, about] of TYPES) {
    const buckets = new Map();
    for (const name of [...things.keys()].sort(byText)) {
      const t = things.get(name);
      // The values of a key: the heaviest first, then by text.
      const entries = [['name', name]];
      for (const k of keys) for (const v of [...t[k].keys()].sort((a, b) => t[k].get(b) - t[k].get(a) || byText(a, b))) { entries.push([k, v]); stats.values++; }
      if (entries.length === 1) continue;
      const b = /^[a-z]/.test(name) ? name[0] : '0';
      if (!buckets.has(b)) buckets.set(b, []);
      buckets.get(b).push({ lines: [wire(`${world}.${idPart}.${seg(name)}`, type, entries, SOURCE)] });
      stats.things++;
    }
    const files = {};
    for (const b of [...buckets.keys()].sort(byText)) {
      const parts = splitParts(buckets.get(b), limits);
      parts.forEach((part, i) => {
        const name = `${PREFIX}${b}${parts.length === 1 ? '' : `-${String(i + 1).padStart(2, '0')}`}`;
        files[`${name}.sop`] = `${header({
          id: `${world}/shards/${name}`,
          about: `common sense about things whose name begins with "${b}"${parts.length > 1 ? ` (part ${i + 1} of ${parts.length})` : ''}: ${about}, from ConceptNet 5.7`,
          sources: ['conceptnet 5.7 (ConceptNet 5.7, English edges of weight 2 or more, CC-BY-SA-4.0)'],
          license: 'CC-BY-SA-4.0', script: 'tools/import/conceptnet.mjs',
        })}\n${part.flatMap((g) => g.lines).join('\n')}\n`;
        stats.shards++;
      });
    }
    out[world] = files;
  }
  return { files: out['k.commonsense'], attributeFiles: out['k.attributes'], stats };
}

// The names of the things in the shards this script does not write (lower case).
export function takenThings(dir, type = 'k.commonsense.thing') {
  const taken = new Set();
  if (!existsSync(dir)) return taken;
  const re = new RegExp(` ${type.replace(/\./g, '\\.')} name=("[^"]*"|\\S+)`, 'g');
  for (const f of readdirSync(dir).sort()) {
    if (!f.endsWith('.sop') || f.startsWith(PREFIX)) continue;
    for (const m of readFileSync(join(dir, f), 'utf8').matchAll(re)) taken.add((m[1].startsWith('"') ? JSON.parse(m[1]) : m[1]).toLowerCase());
  }
  return taken;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const arg = (name, dflt) => { const i = process.argv.indexOf(`--${name}`); return i < 0 ? dflt : process.argv[i + 1]; };
  const input = arg('in', join(repo, 'sources/conceptnet/raw/conceptnet-assertions-5.7.0.csv.gz'));
  const out = arg('out', join(repo, 'docs/worlds/k.commonsense/shards'));
  const outAttributes = arg('out-attributes', join(repo, 'docs/worlds/k.attributes/shards'));
  if (!existsSync(input)) { console.error(`not found: ${input}\nSee sources/conceptnet/SOURCE.md for how to fetch it.`); process.exit(1); }
  const stream = input.endsWith('.gz') ? createReadStream(input).pipe(createGunzip()) : createReadStream(input);
  const { files, attributeFiles, stats } = await importConceptnet(createInterface({ input: stream, crlfDelay: Infinity }), { minWeight: Number(arg('min-weight', 2)), taken: takenThings(out), takenAttributes: takenThings(outAttributes, 'k.attributes.thing') });
  writeShards(out, files, PREFIX);
  writeShards(outAttributes, attributeFiles, PREFIX);
  console.log(JSON.stringify(stats));
}
