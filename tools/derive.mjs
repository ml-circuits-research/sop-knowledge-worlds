// Derived facts visible to tools (reviewer block 2026-11-14 02:45, item 3): the rules of a module make facts only
// when a world loads it with its facts, so a tool or a host that reads shards (JOINS, COVERAGE, ASPECTS, the demo's
// lookups) never saw them. This step runs the rules of each module that has rules (`core.rule` in its schema) over
// the told facts of the module and of the modules it imports, reads which values a rule made, and writes them into
// the generated shards `docs/worlds/<world>/shards/derived*.sop`:
//   - one wire per thing and rule: the identity keys of the thing, the values that rule made, `derived=true`, and
//     `core.source="rule <rule id>"` (the rule as source; sources/rule/SOURCE.md);
//   - a value that is also told is not written (the told fact is its home);
//   - the licence of the shard is the licence of the facts the rules read (all CC0-1.0 so far; a mix is refused).
// The module's own derived shards are left out of the reading, so a rerun gives the same files (a test checks it).
// Loaded together with the rules, a derived wire is the rule's own conclusion (same identity, or every entry
// already there), so nothing is made twice.
//   node tools/derive.mjs            rewrites docs/worlds/*/shards/derived*.sop
import { readFileSync, writeFileSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from './sopworld/sopworld.mjs';
import { WORLDS_DIR, scanWorlds, schemaWorld, moduleInfo, readHeader } from './lib/worlds.mjs';
import { splitParts, seg, byText } from './import/lib.mjs';

export const DERIVED = 'derived';
const isDerivedShard = (s) => s.id.split('/').pop().startsWith(DERIVED);

// The modules imported by a module, all the way down.
const importsOf = (worlds, id, seen = new Set()) => {
  for (const dep of moduleInfo(worlds.find((w) => w.id === id).schemaText)?.imports ?? []) if (!seen.has(dep)) { seen.add(dep); importsOf(worlds, dep, seen); }
  return seen;
};
const hasRules = (w) => parse(w.schemaText).some((x) => x.type === 'core.rule');
// The modules whose world runs rules: those with rules of their own and those that import one (k.shapes imports
// k.kinds, whose rules give every shape its kinds above).
export const ruleWorlds = (worlds) => worlds.filter((w) => hasRules(w) || [...importsOf(worlds, w.id)].some((d) => hasRules(worlds.find((x) => x.id === d))));

// The rule ids of a schema (as written: `k.time.order`).
const rulesOf = (schemaText) => parse(schemaText).filter((x) => x.type === 'core.rule').map((x) => x.id);

// The identity keys of a type, from the slots of every schema (nearest declaration is the type's own).
function identityKeys(worlds) {
  const ids = new Map();
  for (const w of worlds) for (const x of parse(w.schemaText)) if (x.type === 'core.slot' && x.attrs.id?.[0] === 'true') {
    const t = x.attrs.of[0];
    if (!ids.has(t)) ids.set(t, []);
    ids.get(t).push(x.attrs.key[0]);
  }
  // a type that declares no identity key of its own takes those of the type it extends (k.people.role: k.kinds.kind)
  const parents = new Map();
  for (const w of worlds) for (const x of parse(w.schemaText)) if (x.type === 'core.type' && x.attrs.extends) parents.set(x.attrs.of?.[0] ?? x.id, x.attrs.extends);
  const up = (t, seen = new Set()) => ids.get(t) ?? (seen.has(t) ? undefined : (seen.add(t), (parents.get(t) ?? []).map((p) => up(p, seen)).find(Boolean)));
  for (const t of parents.keys()) if (!ids.has(t)) { const k = up(t); if (k) ids.set(t, k); }
  return ids;
}

// A world with the schema of `id` and the told facts of it and of its imports (no derived shard); also which shard
// each told wire came from, for the licence.
function toldWorld(worlds, id) {
  const { world, result } = schemaWorld(worlds, id);
  if (!result.ok) throw new Error(`${id}: ${JSON.stringify(result.violations)}`);
  const shardOf = new Map();
  const told = []; // the told wires, to keep a told value out of the derived ones
  const seen = new Set();
  const add = (wid) => {
    if (seen.has(wid)) return;
    seen.add(wid);
    const entry = worlds.find((w) => w.id === wid);
    for (const dep of moduleInfo(entry.schemaText)?.imports ?? []) add(dep);
    for (const s of entry.shards) {
      if (isDerivedShard(s)) continue;
      const r = world.tell(s.text);
      if (!r.ok) throw new Error(`${s.id}: ${JSON.stringify(r.violations)}`);
      for (const w of parse(s.text)) { shardOf.set(w.id, s); told.push(w); }
    }
  };
  add(id);
  return { world, shardOf, told };
}

// The derived values of one module, on the wires of its own types, made by its rules or by those of a module it
// imports: [{ type, identity: [[key, token]], rule, entries: [[key, token]], from: [ids] }].
export function derivedOf(worlds, id) {
  const entry = worlds.find((w) => w.id === id);
  const loaded = [entry, ...[...importsOf(worlds, id)].map((d) => worlds.find((w) => w.id === d))];
  const rules = new Set(loaded.flatMap((w) => rulesOf(w.schemaText)));
  const ids = identityKeys(worlds);
  const { world, shardOf, told } = toldWorld(worlds, id);
  const idOf = (type, attrs) => `${type} ${JSON.stringify((ids.get(type) ?? []).map((k) => attrs[k]?.[0]))}`;
  const toldValues = new Set();
  for (const w of told) for (const [k, vs] of Object.entries(w.attrs)) for (const v of vs) toldValues.add(`${idOf(w.type, w.attrs)}\u0000${k}\u0000${v}`);
  // the engine names a rule of a module loaded with `use` with the module in front (k.time.k.time.order)
  const ruleId = (via) => { const r = via?.startsWith(`${id}.${id}.`) ? via.slice(id.length + 1) : via; return rules.has(r) ? r : null; };
  const out = new Map(); // `${type} ${identity} ${rule}` -> record
  const put = (w, rule, key, value, from) => {
    if (key.startsWith('core.') || key === 'derived') return; // bookkeeping, not a value a rule made
    const idKeys = ids.get(w.type) ?? [];
    const identity = idKeys.map((k) => [k, w.attrs[k]?.[0]]).filter(([, v]) => v !== undefined);
    if (!identity.length) throw new Error(`${id}: a rule makes ${w.type}, which has no identity key; a derived fact needs one to be found again`);
    const k = `${w.type} ${JSON.stringify(identity)} ${rule}`;
    if (!out.has(k)) out.set(k, { type: w.type, identity, rule, entries: [], from: new Set(), made: false });
    const rec = out.get(k);
    for (const f of from ?? []) rec.from.add(f);
    if (idKeys.includes(key)) { if (!toldValues.has(`${idOf(w.type, w.attrs)}\u0000${key}\u0000${value}`)) rec.made = true; return; } // the wire itself is the rule's; its identity is written anyway
    for (const v of [].concat(value)) if (!toldValues.has(`${idOf(w.type, w.attrs)}\u0000${key}\u0000${v}`) && !rec.entries.some(([a, b]) => a === key && b === v)) rec.entries.push([key, v]);
  };
  const types = new Set();
  for (const m of loaded) {
    const wires = parse(m.schemaText);
    for (const r of wires.filter((x) => x.type === 'core.rule')) for (const t of r.attrs.then ?? []) {
      const tpl = wires.find((x) => x.id === t.slice(1));
      if (tpl && !tpl.attrs['core.on']) types.add(tpl.type);
    }
  }
  const done = new Set();
  for (const type of [...types].sort(byText)) for (const w of world.ofType(type)) {
    if (done.has(w.id) || !w.type.startsWith(`${id}.`)) continue; // a module writes the derived values of its own types
    done.add(w.id);
    const meta = w.meta ?? {};
    const fills = (meta.fills ?? []).filter((f) => ruleId(f.via));
    const filled = new Set(fills.map((f) => `${f.key}\u0000${f.value}`));
    const made = ruleId(meta.via);
    if (made) for (const [key, vals] of Object.entries(w.attrs)) for (const v of vals) if (!filled.has(`${key}\u0000${v}`)) put(w, made, key, v, meta.from);
    for (const f of fills) put(w, ruleId(f.via), f.key, f.value, f.from);
  }
  const records = [...out.values()].filter((r) => r.entries.length || r.made);
  const licenses = new Set();
  for (const r of records) for (const f of r.from) { const s = shardOf.get(f); if (s) licenses.add(readHeader(s.text).license?.[0]); }
  return { records, licenses: [...licenses].filter(Boolean).sort(byText) };
}

const line = (world, r) => {
  const name = r.identity.map(([, v]) => seg(v.startsWith('"') ? JSON.parse(v) : v)).join('.');
  const rule = r.rule.startsWith(`${world}.`) ? r.rule.slice(world.length + 1) : r.rule;
  const id = `${world}.${DERIVED}.${rule}.${name}`;
  const entries = [...r.identity, ...r.entries.sort((a, b) => byText(a[0], b[0]) || byText(a[1], b[1]))];
  return `@${id} ${r.type} ${entries.map(([k, v]) => `${k}=${v}`).join(' ')} derived=true core.source=${JSON.stringify(`rule ${r.rule}`)}`;
};

// The files of the derived shards of one module: name -> text.
export function derivedShards(worlds, id) {
  const { records, licenses } = derivedOf(worlds, id);
  if (!records.length) return {};
  if (licenses.length > 1) throw new Error(`${id}: the rules read facts under ${licenses.join(', ')}; one licence per shard`);
  const license = licenses[0] ?? 'CC0-1.0';
  const entry = worlds.find((w) => w.id === id);
  const version = moduleInfo(entry.schemaText).version;
  const rules = [...new Set(records.map((r) => r.rule))].sort(byText);
  const groups = [];
  for (const rule of rules) {
    const lines = records.filter((r) => r.rule === rule).map((r) => line(id, r)).sort(byText);
    groups.push({ lines });
  }
  const parts = splitParts(groups);
  const files = {};
  parts.forEach((part, i) => {
    const name = parts.length === 1 ? `${DERIVED}.sop` : `${DERIVED}-${i + 1}.sop`;
    const lines = part.flatMap((g) => g.lines);
    const used = [...new Set(lines.map((l) => /core\.source="rule ([^"]+)"/.exec(l)[1]))];
    const head = [`# ${id}/shards/${name.slice(0, -4)}: generated, do not edit. What the rules of ${id} (version ${version}) and of the modules it imports derive from the told facts`,
      `# of ${[id, ...importsOf(worlds, id)].join(', ')}: ${lines.length} facts, each marked derived=true with its rule as source (${used.join(', ')}).`,
      '# sources: rule (a rule of a module of this repository, over the facts named above; sources/rule/SOURCE.md)',
      `# license: ${license}`, '# script: tools/derive.mjs', ''].join('\n');
    files[name] = `${head}\n${lines.join('\n')}\n`;
  });
  return files;
}

export function deriveAll(worlds = scanWorlds()) {
  const all = {};
  for (const w of ruleWorlds(worlds)) all[w.id] = derivedShards(worlds, w.id);
  return all;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const all = deriveAll();
  for (const [id, files] of Object.entries(all)) {
    const dir = join(WORLDS_DIR, id, 'shards');
    for (const old of existsSync(dir) ? readdirSync(dir) : []) if (old.startsWith(DERIVED) && old.endsWith('.sop')) rmSync(join(dir, old));
    for (const [name, text] of Object.entries(files)) writeFileSync(join(dir, name), text);
    const n = Object.values(files).reduce((s, t) => s + t.split('\n').filter((l) => l.startsWith('@')).length, 0);
    console.log(`${id}: ${Object.keys(files).length} derived shard(s), ${n} facts`);
  }
}
