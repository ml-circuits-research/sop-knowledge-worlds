// Shared helpers: find the worlds under docs/worlds, read shard headers, load them into sopworld.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { World, parse, SCHEMA_TYPES } from '../sopworld/sopworld.mjs';

export const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const WORLDS_DIR = join(REPO, 'docs', 'worlds');
export const MAX_WIRES = 2000;
export const MAX_BYTES = 300 * 1024;

const byText = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

// A reusable world written as facts (w.lang.en: types and shards, loaded like a knowledge world), not as a
// std.schema world (w.list, w.seating: a schema a user fills, loaded with the newer build by tools/lib/schemas.mjs).
export const isFactWorld = (root, d) => d.startsWith('w.') && !/\bstd\.schema\.world\b/.test(readFileSync(join(root, d, 'schema.sop'), 'utf8'));

// Every directory k.<world>/ (and every w.<world>/ of facts) with a schema.sop, and its shards/*.sop, sorted by name.
export function scanWorlds(root = WORLDS_DIR) {
  if (!existsSync(root)) return [];
  return readdirSync(root)
    .filter((d) => (d.startsWith('k.') || d.startsWith('w.')) && statSync(join(root, d)).isDirectory() && existsSync(join(root, d, 'schema.sop')) && (d.startsWith('k.') || isFactWorld(root, d)))
    .sort(byText)
    .map((id) => {
      const dir = join(root, id);
      const schemaText = readFileSync(join(dir, 'schema.sop'), 'utf8');
      const shardDir = join(dir, 'shards');
      const shards = existsSync(shardDir)
        ? readdirSync(shardDir).filter((f) => f.endsWith('.sop')).sort(byText).map((f) => {
          const path = join(shardDir, f);
          const text = readFileSync(path, 'utf8');
          return { id: `${id}/shards/${f.slice(0, -4)}`, path: relative(root, path).split('\\').join('/'), file: path, text, bytes: Buffer.byteLength(text) };
        })
        : [];
      return { id, dir, schemaPath: `${id}/schema.sop`, schemaText, shards };
    });
}

// The header of a .sop file: leading comment lines "# key: value" (keys repeat).
export function readHeader(text) {
  const header = {};
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (t === '') continue;
    if (!t.startsWith('#')) break;
    const m = /^#\s*([a-z]+):\s*(.*)$/.exec(t);
    if (m) (header[m[1]] ??= []).push(m[2].trim());
  }
  return header;
}

// The sources of a hand-written fact: hand-core, and psys2-worlds where tools/import/psys2.mjs laid a fact of the
// PSys2 tab worlds next to it (the facts of one thing merge). For tests of the hand-written worlds.
// A loaded wire may also carry `rule <id>`: a value a rule derived (shards `derived`, tools/derive.mjs) merges into
// the told wire of the same thing; it never stands alone.
export const handSources = (sources) => {
  const told = (sources ?? []).filter((s) => !/^"rule [^"]+"$/.test(s));
  return told.length > 0 && told.every((s) => s === '"hand-core 1"' || /^"psys2-worlds [0-9a-f]+"$/.test(s)) && (told.includes('"hand-core 1"') || told.length === 1);
};

export const library = (worlds) => Object.fromEntries(worlds.map((w) => [w.id, w.schemaText]));

export const isMatrix = (wire, text) => SCHEMA_TYPES.has(wire.type);

// A world with the schema of `id` loaded (and, through imports, its dependencies).
export function schemaWorld(worlds, id) {
  const w = new World({ library: library(worlds) });
  const r = w.use(id);
  return { world: w, result: r };
}

// The module wire of a schema: name, version, imports, exports.
export function moduleInfo(schemaText) {
  const m = parse(schemaText).find((x) => x.type === 'core.module');
  if (!m) return null;
  const name = m.attrs.name?.[0] ?? m.id;
  const full = (t) => (t.startsWith(`${name}.`) ? t : `${name}.${t}`);
  return { name, version: m.attrs.version?.[0] ?? null, imports: m.attrs.imports ?? [], exports: (m.attrs.exports ?? []).map(full) };
}

export const fmtViolation = (v) => `${v.kind}${v.id ? ` ${v.id}` : ''}${v.key ? `.${v.key}` : ''}: ${v.why ?? ''}`.trim();

// A world with the schema of `id` and every shard of it and of the worlds it depends on. Throws on a refusal.
export function fullWorld(id, worlds = scanWorlds()) {
  const { world, result } = schemaWorld(worlds, id);
  if (!result.ok) throw new Error(`${id}: ${JSON.stringify(result.violations)}`);
  const seen = new Set();
  const add = (wid) => {
    if (seen.has(wid)) return;
    seen.add(wid);
    const entry = worlds.find((w) => w.id === wid);
    for (const dep of moduleInfo(entry.schemaText)?.imports ?? []) add(dep);
    for (const s of entry.shards) {
      const r = world.tell(s.text);
      if (!r.ok) throw new Error(`${s.id}: ${JSON.stringify(r.violations)}`);
    }
  };
  add(id);
  return world;
}
