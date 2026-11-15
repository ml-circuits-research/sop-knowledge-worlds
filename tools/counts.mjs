// KR5 (review 2026-11-15, finding 31): the counts in README.md and the WORLD.md files are generated, not typed. A count
// is written between markers, `<!--n:SPEC-->1,234<!--/n-->` (the comment is invisible on the page), and this tool
// rewrites the number from the shards and schemas:
//   worlds           the knowledge worlds (k.* and the w.* written as facts) with a schema
//   schemas          the world schemas (w.* in std.schema format)
//   facts:<type>     the things of a type: distinct values of its identity keys (a thing told in two shards counts once)
//   named-takers     the types that take the slot group k.named (extends=k.named.labelled)
//   slots:<key>      the slots of that key in the k.* schemas; slot-worlds:<key> the worlds they are in
//   node tools/counts.mjs           rewrites the files (npm run build runs it before the catalog)
//   node tools/counts.mjs --check   says which files are stale, changes nothing
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from './sopworld/sopworld.mjs';
import { REPO, WORLDS_DIR, scanWorlds, factsOf } from './lib/worlds.mjs';
import { scanSchemas } from './lib/schemas.mjs';

export const MARK = /<!--n:([^>]+?)-->([0-9,]*)<!--\/n-->/g;
export const FILES = () => ['README.md', 'docs/worlds/README.md', ...readdirSync(WORLDS_DIR).filter((d) => existsSync(join(WORLDS_DIR, d, 'WORLD.md'))).map((d) => `docs/worlds/${d}/WORLD.md`)];
const fmt = (n) => n.toLocaleString('en-US');

export function counter(worlds = scanWorlds()) {
  const schemaWires = worlds.flatMap((w) => parse(w.schemaText).map((x) => ({ ...x, world: w.id })));
  const memo = new Map();
  const idKeys = (type) => {
    const own = schemaWires.filter((x) => x.type === 'core.slot' && x.attrs.of?.[0] === type && x.attrs.id?.[0] === 'true').map((x) => x.attrs.key[0]);
    if (own.length) return own;
    const t = schemaWires.find((x) => x.type === 'core.type' && (x.attrs.of?.[0] ?? x.id) === type);
    for (const p of t?.attrs.extends ?? []) { const k = idKeys(p); if (k.length) return k; }
    return [];
  };
  const value = (spec) => {
    if (memo.has(spec)) return memo.get(spec);
    let n;
    const [kind, arg] = spec.split(':');
    if (kind === 'worlds') n = worlds.length;
    else if (kind === 'schemas') n = scanSchemas().length;
    else if (kind === 'named-takers') n = schemaWires.filter((x) => x.type === 'core.type' && (x.attrs.extends ?? []).includes('k.named.labelled')).length;
    else if (kind === 'slots' || kind === 'slot-worlds') {
      const slots = schemaWires.filter((x) => x.type === 'core.slot' && x.world.startsWith('k.') && x.attrs.key?.[0] === arg);
      n = kind === 'slots' ? slots.length : new Set(slots.map((x) => x.world)).size;
    } else if (kind === 'facts') {
      const world = worlds.filter((w) => arg.startsWith(`${w.id}.`)).sort((a, b) => b.id.length - a.id.length)[0];
      if (!world) throw new Error(`counts: no world for ${arg}`);
      const keys = idKeys(arg);
      n = new Set(factsOf(world.id, arg, worlds).map((w) => (keys.length ? JSON.stringify(keys.map((k) => w.attrs[k]?.[0])) : w.id))).size;
    } else throw new Error(`counts: unknown spec ${spec}`);
    memo.set(spec, n);
    return n;
  };
  return value;
}

// file -> its text with every marked count rewritten
export function countedFiles(worlds = scanWorlds()) {
  const value = counter(worlds);
  const out = {};
  for (const f of FILES()) {
    const text = readFileSync(join(REPO, f), 'utf8');
    if (!text.includes('<!--n:')) continue;
    out[f] = text.replace(MARK, (_, spec) => `<!--n:${spec}-->${fmt(value(spec))}<!--/n-->`);
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const check = process.argv.includes('--check');
  let stale = 0;
  for (const [f, text] of Object.entries(countedFiles())) {
    if (readFileSync(join(REPO, f), 'utf8') === text) continue;
    stale++;
    if (check) console.error(`stale counts: ${f}`); else writeFileSync(join(REPO, f), text);
  }
  if (check && stale) process.exit(1);
}
