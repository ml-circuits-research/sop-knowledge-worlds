// The reusable worlds (w.*): schemas in the library's std.schema format, under docs/worlds/w.<name>/schema.sop.
// They need std.schema and std.acts; they are loaded with the one pinned build (tools/sopworld/VERSION), the same
// that validates the knowledge worlds (Q35: one build).
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { World, parse } from '../sopworld/sopworld.mjs';
import { WORLDS_DIR, REPO, isFactWorld } from './worlds.mjs';

const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const byText = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

export function scanSchemas(root = WORLDS_DIR) {
  if (!existsSync(root)) return [];
  return readdirSync(root).filter((d) => d.startsWith('w.') && statSync(join(root, d)).isDirectory() && existsSync(join(root, d, 'schema.sop')) && !isFactWorld(root, d)).sort(byText)
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
  // A world schema may hold denies and rules (the library's kinds-of-worlds), never a function. The patterns and
  // checks a deny or rule names are parts of it and carry no source of their own (a source on a pattern would be
  // matched); every other wire has one.
  const parts = new Set();
  for (const w of wires) if (['core.rule', 'core.deny', 'core.check', 'core.calc'].includes(w.type)) {
    for (const k of ['when', 'not', 'if', 'with', 'then', 'args', 'over']) for (const v of w.attrs[k] ?? []) if (v.startsWith('$')) parts.add(v.slice(1));
  }
  for (const w of wires) {
    if (!w.id.startsWith(`${s.id}`)) errors.push(`${w.id}: an id outside ${s.id}`);
    if (!w.attrs['core.source'] && !parts.has(w.id)) errors.push(`${w.id}: no core.source`);
    if (parts.has(w.id) && w.attrs['core.source']) errors.push(`${w.id}: a pattern or check with core.source (it would be matched)`);
    if (['core.function'].includes(w.type)) errors.push(`${w.id}: a world schema names no function of its own (${w.type})`);
    if (['core.rule', 'core.deny'].includes(w.type) && !w.attrs['core.source']) errors.push(`${w.id}: no core.source`);
  }
  if (!module || tok(module.attrs.name?.[0]) !== s.id) errors.push(`${s.id}: core.module name=${s.id} is missing`);
  if (!world || tok(world.attrs.name?.[0]) !== s.id) errors.push(`${s.id}: std.schema.world name=${s.id} is missing`);
  const slots = wires.filter((w) => w.type === 'core.slot');
  // A kind's attributes: its own slots and those of the types it extends inside the schema (w.face: every part
  // extends w.face.part).
  const parents = Object.fromEntries(wires.filter((w) => w.type === 'core.type').map((t) => [t.attrs.of[0], t.attrs.extends ?? []]));
  const chain = (t, seen = new Set()) => (seen.has(t) || !(t in parents) ? [] : (seen.add(t), [t, ...parents[t].flatMap((p) => chain(p, seen))]));
  const attributesOf = (t) => chain(t).flatMap((x) => slots.filter((sl) => sl.attrs.of[0] === x).map((sl) => sl.attrs.key[0]));
  const kinds = wires.filter((w) => w.type === 'std.schema.kind').map((k) => ({ type: k.attrs.of[0], acts: k.attrs.acts ?? [], attributes: attributesOf(k.attrs.of[0]) }));
  const words = (means) => [...new Set(wires.filter((w) => w.type === 'core.word' && tok(w.attrs.means?.[0]) === means).flatMap((w) => (w.attrs.text ?? []).map(tok)))];
  for (const k of kinds) { k.words = words(k.type); if (!k.words.length) errors.push(`${k.type}: no core.word`); }
  for (const x of slots) if (!words(`${x.attrs.of[0]}.${x.attrs.key[0]}`).length) errors.push(`${x.attrs.of[0]}.${x.attrs.key[0]}: no core.word`);
  const names = words(s.id);
  if (!names.length) errors.push(`${s.id}: no core.word for the world`);
  const allWords = [...new Set(wires.filter((w) => w.type === 'core.word').flatMap((w) => (w.attrs.text ?? []).map(tok)))];
  return { entry: { id: s.id, version: tok(module?.attrs.version?.[0]) ?? null, schema: s.schemaPath, about: tok(world?.attrs.doc?.[0]) ?? null, names, kinds, wires: wires.length, bytes: Buffer.byteLength(s.schemaText), sources: ['hand-core-1'], license: 'CC0-1.0', warnings }, errors, allWords, names };
}
