// Audit of the part names a language model gave (sources/<noto-emoji|openmoji|mulberry>/part-names.tsv): a seeded random
// sample of the named parts, each drawn with only that part highlighted, for a look by eye.
//   node tools/audit-part-names.mjs [--seed 4] [--n 200] [--floor 30] --out <dir>
//   node tools/audit-part-names.mjs --all <source> --out <dir>    every named part of one source (small pictures), in file order
//   node tools/audit-part-names.mjs --only <source> --seed 5 --n 100 --out <dir>    a sample of one source
// Writes <dir>/sample.tsv (n, source, object, part number, name, kind) and <dir>/<n>.svg. The sample is drawn per
// source: at least `floor` parts from each source (all of them when it has fewer), the rest in proportion to the
// number of named parts; inside a source without replacement, in the order of the rows of its file.
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, fullWorld } from './lib/worlds.mjs';
import { renderHighlighted } from './render-svg.mjs';

export const SOURCES = ['noto-emoji', 'openmoji', 'mulberry'];

// A small seeded generator (mulberry32): the same seed gives the same sample.
export const random = (seed) => () => {
  seed = (seed + 0x6D2B79F5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// The rows with a name of one part-names.tsv text.
export const namedRows = (tsv) => tsv.split('\n').filter((l) => l.trim() && !l.startsWith('#')).map((l) => l.split('\t').map((x) => x.trim()))
  .filter((r) => r[2]).map(([object, n, name, kind]) => ({ object, n: Number(n), name, kind: kind ?? '' }));

// rows: { source: [row] }. Returns [{ source, ...row }], sources in the order given, rows in file order.
export function sample(rows, { seed = 4, n = 200, floor = 30 } = {}) {
  const rnd = random(seed);
  const ids = Object.keys(rows);
  const total = ids.reduce((t, id) => t + rows[id].length, 0);
  const quota = Object.fromEntries(ids.map((id) => [id, Math.min(rows[id].length, Math.max(floor, Math.round(n * rows[id].length / total)))]));
  // Take what is over n from the largest source.
  const over = ids.reduce((t, id) => t + quota[id], 0) - n;
  const largest = ids.reduce((a, b) => (rows[a].length >= rows[b].length ? a : b));
  quota[largest] = Math.max(0, quota[largest] - over);
  const out = [];
  for (const id of ids) {
    const idx = rows[id].map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    for (const i of idx.slice(0, quota[id]).sort((a, b) => a - b)) out.push({ source: id, ...rows[id][i] });
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = (name, dflt) => { const i = process.argv.indexOf(`--${name}`); return i < 0 ? dflt : process.argv[i + 1]; };
  const out = arg('out');
  if (!out) throw new Error('--out <dir> is needed');
  const rows = Object.fromEntries(SOURCES.map((s) => [s, namedRows(readFileSync(join(REPO, 'sources', s, 'part-names.tsv'), 'utf8'))]));
  const all = arg('all');
  const only = arg('only');
  if (only) for (const s of SOURCES) if (s !== only) rows[s] = [];
  const picked = all ? rows[all].map((r) => ({ source: all, ...r })) : sample(rows, { seed: Number(arg('seed', 4)), n: Number(arg('n', 200)), floor: Number(arg('floor', 30)) });
  mkdirSync(out, { recursive: true });
  const world = fullWorld('k.objects');
  picked.forEach((r, i) => writeFileSync(join(out, `${String(i + 1).padStart(4, '0')}.svg`), renderHighlighted(world, r.object, r.n, all ? { compact: true, label: String(i + 1) } : {})));
  writeFileSync(join(out, 'sample.tsv'), `${picked.map((r, i) => [i + 1, r.source, r.object, r.n, r.name, r.kind].join('\t')).join('\n')}\n`);
  const count = Object.fromEntries(SOURCES.map((s) => [s, `${picked.filter((r) => r.source === s).length} of ${rows[s].length}`]));
  console.log(JSON.stringify(count));
}
