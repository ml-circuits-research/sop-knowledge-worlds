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

// Every directory k.<world>/ with a schema.sop, and its shards/*.sop, sorted by name.
export function scanWorlds(root = WORLDS_DIR) {
  if (!existsSync(root)) return [];
  return readdirSync(root)
    .filter((d) => d.startsWith('k.') && statSync(join(root, d)).isDirectory() && existsSync(join(root, d, 'schema.sop')))
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
