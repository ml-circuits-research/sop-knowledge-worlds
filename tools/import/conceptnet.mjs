// ConceptNet 5.7 -> k.commonsense shards: English edges of weight 2 or more for AtLocation, CapableOf, UsedFor,
// MadeOf, IsA, PartOf and HasA, one fact per thing. NOT RUN in this repository's network (the dump is on S3): a
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
// ConceptNet relation -> the key of k.commonsense.thing it becomes.
export const RELATIONS = { AtLocation: 'at', CapableOf: 'can', UsedFor: 'used_for', MadeOf: 'made_of', IsA: 'is_a', PartOf: 'part_of', HasA: 'has' };
const KEYS = Object.values(RELATIONS);

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

// lines: an (async) iterable of lines; taken: lower-case names that hand-written facts already have (they win).
export async function importConceptnet(lines, { minWeight = 2, taken = new Set(), limits } = {}) {
  const things = new Map();
  const stats = { lines: 0, edges: 0, things: 0, values: 0, skippedTaken: 0, shards: 0 };
  for await (const line of lines) {
    stats.lines++;
    const e = readEdge(line, minWeight);
    if (!e) continue;
    stats.edges++;
    if (taken.has(e.name.toLowerCase())) { stats.skippedTaken++; continue; }
    if (!things.has(e.name)) things.set(e.name, Object.fromEntries(KEYS.map((k) => [k, new Map()])));
    const values = things.get(e.name)[e.key];
    values.set(e.value, Math.max(values.get(e.value) ?? 0, e.weight));
  }
  const buckets = new Map();
  for (const name of [...things.keys()].sort(byText)) {
    const t = things.get(name);
    // The values of a key: the heaviest first, then by text.
    const entries = [['name', name]];
    for (const k of KEYS) for (const v of [...t[k].keys()].sort((a, b) => t[k].get(b) - t[k].get(a) || byText(a, b))) { entries.push([k, v]); stats.values++; }
    const b = /^[a-z]/.test(name) ? name[0] : '0';
    if (!buckets.has(b)) buckets.set(b, []);
    buckets.get(b).push({ lines: [wire(`k.commonsense.cn.${seg(name)}`, 'k.commonsense.thing', entries, SOURCE)] });
    stats.things++;
  }
  const files = {};
  for (const b of [...buckets.keys()].sort(byText)) {
    const parts = splitParts(buckets.get(b), limits);
    parts.forEach((part, i) => {
      const name = `${PREFIX}${b}${parts.length === 1 ? '' : `-${String(i + 1).padStart(2, '0')}`}`;
      files[`${name}.sop`] = `${header({
        id: `k.commonsense/shards/${name}`,
        about: `common sense about things whose name begins with "${b}"${parts.length > 1 ? ` (part ${i + 1} of ${parts.length})` : ''}: where they are, what they can do, what they are used for and made of, what they are a kind and a part of, what they have.`,
        sources: ['conceptnet 5.7 (ConceptNet 5.7, English edges of weight 2 or more, CC-BY-SA-4.0)'],
        license: 'CC-BY-SA-4.0', script: 'tools/import/conceptnet.mjs',
      })}\n${part.flatMap((g) => g.lines).join('\n')}\n`;
      stats.shards++;
    });
  }
  return { files, stats };
}

// The names of the things in the shards this script does not write (lower case).
export function takenThings(dir) {
  const taken = new Set();
  if (!existsSync(dir)) return taken;
  for (const f of readdirSync(dir).sort()) {
    if (!f.endsWith('.sop') || f.startsWith(PREFIX)) continue;
    for (const m of readFileSync(join(dir, f), 'utf8').matchAll(/ k\.commonsense\.thing name=("[^"]*"|\S+)/g)) taken.add((m[1].startsWith('"') ? JSON.parse(m[1]) : m[1]).toLowerCase());
  }
  return taken;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const arg = (name, dflt) => { const i = process.argv.indexOf(`--${name}`); return i < 0 ? dflt : process.argv[i + 1]; };
  const input = arg('in', join(repo, 'sources/conceptnet/raw/conceptnet-assertions-5.7.0.csv.gz'));
  const out = arg('out', join(repo, 'docs/worlds/k.commonsense/shards'));
  if (!existsSync(input)) { console.error(`not found: ${input}\nSee sources/conceptnet/SOURCE.md for how to fetch it.`); process.exit(1); }
  const stream = input.endsWith('.gz') ? createReadStream(input).pipe(createGunzip()) : createReadStream(input);
  const { files, stats } = await importConceptnet(createInterface({ input: stream, crlfDelay: Infinity }), { minWeight: Number(arg('min-weight', 2)), taken: takenThings(out) });
  writeShards(out, files, PREFIX);
  console.log(JSON.stringify(stats));
}
