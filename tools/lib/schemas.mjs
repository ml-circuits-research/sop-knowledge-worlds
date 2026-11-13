// The reusable worlds (w.*): schemas in the library's std.schema format, under docs/worlds/w.<name>/schema.sop.
// They need std.schema and std.acts, so they are loaded with the build pinned in tools/sopworld/w/ (see its
// VERSION), not with the build that validates the knowledge worlds.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { World, parse } from '../sopworld/w/sopworld.mjs';
import { WORLDS_DIR, REPO } from './worlds.mjs';

const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const byText = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
export const W_SOPWORLD = /commit: ([0-9a-f]{7})/.exec(readFileSync(join(REPO, 'tools/sopworld/w/VERSION'), 'utf8'))[1];

export function scanSchemas(root = WORLDS_DIR) {
  if (!existsSync(root)) return [];
  return readdirSync(root).filter((d) => d.startsWith('w.') && statSync(join(root, d)).isDirectory() && existsSync(join(root, d, 'schema.sop'))).sort(byText)
    .map((id) => ({ id, dir: join(root, id), schemaPath: `${id}/schema.sop`, schemaText: readFileSync(join(root, id, 'schema.sop'), 'utf8') }));
}

// A world with std.acts and the reusable worlds named (all by default). Throws on a refusal.
export function actsWorld(ids, schemas = scanSchemas()) {
  const w = new World({ library: Object.fromEntries(schemas.map((s) => [s.id, s.schemaText])) });
  const r = w.load('@acts core.use world=std.acts');
  if (!r.ok) throw new Error(JSON.stringify(r.violations));
  for (const id of ids ?? schemas.map((s) => s.id)) { const u = w.use(id); if (!u.ok) throw new Error(`${id}: ${JSON.stringify(u.violations)}`); }
  return w;
}

// What the catalog says of a reusable world: its name, what it is, the words that find it, its kinds with their
// acts and attributes, and the errors and warnings of loading it alone.
export function describeSchema(s) {
  const wires = parse(s.schemaText);
  const errors = [], warnings = [];
  try { const w = actsWorld([s.id], [s]); warnings.push(...(w.warnings ?? []).map((x) => x.why ?? x.kind)); } catch (e) { errors.push(e.message); }
  const module = wires.find((w) => w.type === 'core.module');
  const world = wires.find((w) => w.type === 'std.schema.world');
  for (const w of wires) {
    if (!w.id.startsWith(`${s.id}`)) errors.push(`${w.id}: an id outside ${s.id}`);
    if (!w.attrs['core.source']) errors.push(`${w.id}: no core.source`);
    if (['core.function', 'core.rule', 'core.deny', 'core.calc', 'core.check'].includes(w.type)) errors.push(`${w.id}: a reusable world is data only (${w.type})`);
  }
  if (!module || tok(module.attrs.name?.[0]) !== s.id) errors.push(`${s.id}: core.module name=${s.id} is missing`);
  if (!world || tok(world.attrs.name?.[0]) !== s.id) errors.push(`${s.id}: std.schema.world name=${s.id} is missing`);
  const slots = wires.filter((w) => w.type === 'core.slot');
  const kinds = wires.filter((w) => w.type === 'std.schema.kind').map((k) => ({ type: k.attrs.of[0], acts: k.attrs.acts ?? [], attributes: slots.filter((x) => x.attrs.of[0] === k.attrs.of[0]).map((x) => x.attrs.key[0]) }));
  const words = (means) => [...new Set(wires.filter((w) => w.type === 'core.word' && tok(w.attrs.means?.[0]) === means).flatMap((w) => (w.attrs.text ?? []).map(tok)))];
  for (const k of kinds) { k.words = words(k.type); if (!k.words.length) errors.push(`${k.type}: no core.word`); }
  for (const x of slots) if (!words(`${x.attrs.of[0]}.${x.attrs.key[0]}`).length) errors.push(`${x.attrs.of[0]}.${x.attrs.key[0]}: no core.word`);
  const names = words(s.id);
  if (!names.length) errors.push(`${s.id}: no core.word for the world`);
  const allWords = [...new Set(wires.filter((w) => w.type === 'core.word').flatMap((w) => (w.attrs.text ?? []).map(tok)))];
  return { entry: { id: s.id, version: tok(module?.attrs.version?.[0]) ?? null, schema: s.schemaPath, about: tok(world?.attrs.doc?.[0]) ?? null, names, kinds, wires: wires.length, bytes: Buffer.byteLength(s.schemaText), sources: ['hand-core-1'], license: 'CC0-1.0', warnings }, errors, allWords, names };
}
