// Selectional restrictions (block "21:05" item 1, ABSTRACTION ROUND): the argument types of every relation of the
// knowledge worlds and of every role of the acts, as facts a type-driven reader can check.
//   node tools/relations-core.mjs     writes docs/worlds/k.kinds/shards/arguments.sop and relations-<world>.sop
// Two kinds of facts:
//   - k.kinds.argument: a class of arguments (thing, kind, place, person, value, amount, ...), the classes of
//     k.actions.role `holds` and of the objects of relations, each with the catalog types whose things fill it and
//     their senses (the senses of tools/joins.mjs: animal, food, place, person...). Hand-written below.
//   - k.kinds.relation: a key of a type of a knowledge world read as a relation (the sound of an animal: type
//     k.animals.animal, key sound), with its subject (the kind of the type, in a word, and its sense) and its
//     object: the argument class, the types whose things the values name and their senses, a k.values scale.
// The object is found by rule, never by hand. A join declared on the slot (`type=T by=k`, Q61) is the source of truth:
// its type is the object type (`found=declared`, `object_by` k). Otherwise a slot `type=` names its type; a boolean, a number (with a unit in
// k.units.measure: an amount), an enum (a value; a scale where the steps are those of a k.values scale) or a
// free string (text) say their class; any other key is joined by value: the types whose naming key holds at least
// half of the key's distinct values (and two of them, or its only one) are its object types (at most three, the
// best first; another type whose share is below nine tenths of the best is left out; `found=value`: a suggestion,
// listed in docs/worlds/k.kinds/JOINS-REPORT.md until the join is declared). The facts of every shard of every
// knowledge world are read for that, so the `value` facts are regenerated when the worlds change (npm run build);
// the `declared` and `schema` facts depend on the schemas alone.
import { join } from 'node:path';
import { parse } from './sopworld/sopworld.mjs';
import { WORLDS_DIR, scanWorlds } from './lib/worlds.mjs';
import { wire, header, seg, writeShards, byText, text } from './import/lib.mjs';
import { TYPES as NAMED, SENSES } from './joins.mjs';
import { measureRows } from './measures-core.mjs';

const SRC = 'hand-core 1';
// The types of facts about worlds (this tool's and tools/structures-core.mjs'): neither read nor described.
const OWN = new Set(['k.kinds.relation', 'k.kinds.argument', 'k.kinds.structure', 'k.kinds.role', 'k.kinds.form', 'k.kinds.cast']);
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);

// The argument classes. `type`: catalog types whose things fill it (a host may also fill it from the live world
// where `live` says so); `sense`: the senses of tools/joins.mjs it takes; `examples`: plain words.
export const ARGUMENTS = [
  { name: 'thing', about: 'a thing: one of the live world, or a thing the catalog names', live: true, type: ['k.objects.object', 'k.commonsense.thing', 'k.attributes.thing', 'k.scenes.thing'], sense: ['thing', 'animal', 'food', 'plant', 'person', 'body part', 'clothing', 'body in space'], examples: ['the house', 'a cat'] },
  { name: 'kind', about: 'a kind of thing: what is made, what a thing is a kind of', type: ['k.objects.object', 'k.kinds.kind', 'k.words.sense', 'k.animals.class', 'k.space.kind'], sense: ['thing', 'animal', 'food', 'plant', 'person', 'clothing', 'shape'], examples: ['a tree', 'mammal'] },
  { name: 'place', about: 'a place: a relation and the thing it is said of (on the table), a part of a scene, or a named place', live: true, type: ['k.layouts.relation', 'k.layouts.slot', 'k.scenes.scene', 'k.geo.continent', 'k.geo.country', 'k.geo.city', 'k.geo.sea', 'k.geo.lake', 'k.geo.river', 'k.geo.mountain', 'k.geo.desert'], sense: ['place'], examples: ['on the table', 'in the sky', 'France'] },
  { name: 'direction', about: 'a direction', type: ['k.values.direction'], examples: ['left', 'up'] },
  { name: 'value', about: 'a value of an attribute: a colour, a step of a scale, a shape, a position, a word of a closed list', type: ['k.values.colour', 'k.colours.colour', 'k.values.step', 'k.values.shape', 'k.shapes.shape', 'k.values.position', 'k.values.fill', 'k.values.shade'], sense: ['colour', 'shape'], examples: ['red', 'big', 'round'] },
  { name: 'attribute', about: 'an attribute of a thing: a key of a slot of its type', type: ['k.attributes.attribute', 'k.values.scale'], examples: ['colour', 'size'] },
  { name: 'amount', about: 'a number with a unit (k.units.measure says the unit of each key)', type: ['k.units.unit', 'k.values.number'], examples: ['2 metres', 'a bit'] },
  { name: 'number', about: 'a number that counts or orders', type: ['k.values.number'], examples: ['three', '2'] },
  { name: 'name', about: 'a name a person gives, as said', examples: ['Ann', 'lunch'] },
  { name: 'person', about: 'a person: a kind or a role of person, or a person of the live world', live: true, type: ['k.people.kind', 'k.people.role'], sense: ['person'], examples: ['the girl', 'a doctor'] },
  { name: 'group', about: 'a group: a named arrangement, or a group of the live world', live: true, type: ['k.layouts.layout'], examples: ['a row', 'a circle'] },
  { name: 'topic', about: 'what is asked about: a thing, a kind, an attribute or an act', live: true, type: ['k.objects.object', 'k.kinds.kind', 'k.words.sense', 'k.attributes.attribute', 'k.actions.act'], examples: ['the weather', 'colours'] },
  { name: 'means', about: 'how a thing is sent or done: a channel or a tool', type: ['k.objects.object'], examples: ['by email', 'with a rope'] },
  { name: 'act', about: 'an action that a thing does or undergoes: an everyday action of k.actions, or an act', type: ['k.actions.action', 'k.actions.act'], examples: ['fly', 'swim'] },
  { name: 'time', about: 'a time: a month, a weekday, a season, a part of the day, an hour, a span', type: ['k.time.month', 'k.time.weekday', 'k.time.season', 'k.time.part_of_day', 'k.time.hour', 'k.time.duration', 'k.time.ordered'], sense: ['time'], examples: ['Monday', 'winter'] },
  { name: 'word', about: 'a word of English (most in k.words), not the name of a thing of the catalog', type: ['k.words.sense'], examples: ['moo', 'bark'] },
  { name: 'text', about: 'a free text: a definition, a sentence, an example', examples: ['a portable shelter'] },
  { name: 'boolean', about: 'yes or no', examples: ['true'] },
];

// Keys whose values say what a thing is a kind of, whatever they join.
const KIND_KEYS = new Set(['is_a', 'kind_of', 'instance_of', 'kind', 'class', 'family', 'group_of']);
// Keys whose values say where a thing is, whatever they join.
const PLACE_KEYS = new Set(['place', 'at', 'where', 'habitat', 'lives', 'location', 'found']);
// The class of an object type found by a join.
const classOfType = (t) => (t === 'k.words.sense' ? 'word' : /^k\.(values|colours|shapes)\./.test(t) ? 'value' : /^k\.actions\./.test(t) ? 'act' : /^k\.time\./.test(t) ? 'time'
  : /^k\.geo\./.test(t) || t === 'k.layouts.relation' || t === 'k.scenes.scene' ? 'place' : /^k\.people\./.test(t) ? 'person' : t === 'k.layouts.layout' ? 'group' : t === 'k.units.unit' ? 'amount' : 'thing');

// The types of the knowledge worlds: slots (own and inherited), the word for the subject (the last part of the type's
// name), the naming key (that of tools/joins.mjs, else the one identity key) and the sense (tools/joins.mjs).
export function readTypes(worlds) {
  const types = new Map();
  for (const w of worlds.filter((x) => x.id.startsWith('k.'))) {
    for (const x of parse(w.schemaText)) {
      if (x.type === 'core.type' && OWN.has(x.attrs.of[0])) continue;
      if (x.type === 'core.type') types.set(x.attrs.of[0], { world: w.id, extends: x.attrs.extends ?? [], own: [] });
      if (x.type === 'core.slot') types.get(x.attrs.of[0])?.own.push({ key: x.attrs.key[0], attrs: x.attrs });
    }
  }
  const slots = (t, seen = new Set()) => {
    if (seen.has(t) || !types.has(t)) return [];
    seen.add(t);
    const own = types.get(t).own, keys = new Set(own.map((s) => s.key));
    return [...own, ...types.get(t).extends.flatMap((p) => slots(p, seen)).filter((s) => !keys.has(s.key))];
  };
  for (const [t, x] of types) {
    x.slots = slots(t);
    x.word = t.split('.').pop().replace(/_/g, ' ');
    const ids = x.slots.filter((s) => s.attrs.id?.[0] === 'true').map((s) => s.key);
    const named = NAMED.find((n) => n[0] === t);
    x.naming = named ? named[1] : ids.length === 1 ? ids[0] : null;
    x.sense = named && typeof named[2] === 'string' && SENSES.includes(named[2]) ? named[2] : null;
    // a type keyed by the word (k.words.sense, k.parts.usual) is said of a word; one keyed by a drawing or of mixed
    // senses (k.scenes.thing, k.commonsense.thing) of any thing of that name
    if (named && !x.sense) x.word = named[2] === 'word' ? 'word' : 'thing';
  }
  return types;
}

// Every shard of every knowledge world, read once: the names of each type (lower case) and the distinct values of
// each key of each type (lower case; strings of a slot of kind string alone are not read).
export function readValues(worlds, types) {
  const names = new Map(), values = new Map();
  const add = (m, k, v) => { if (!m.has(k)) m.set(k, new Set()); m.get(k).add(v); };
  for (const w of worlds.filter((x) => x.id.startsWith('k.'))) for (const s of w.shards) for (const x of parse(s.text)) {
    const t = types.get(x.type);
    if (!t) continue;
    for (const [k, vs] of Object.entries(x.attrs)) {
      if (k.startsWith('core.')) continue;
      for (const v of vs) {
        if (v.startsWith('$')) continue;
        const s2 = String(tok(v)).toLowerCase();
        if (k === t.naming) add(names, x.type, s2);
        else add(values, `${x.type} ${k}`, s2);
      }
    }
  }
  return { names, values };
}

// A value and its singular by the regular endings (seeds -> seed, berries -> berry, boxes -> box), for joining.
const forms = (v) => [v, ...(/ies$/.test(v) ? [v.replace(/ies$/, 'y')] : []), ...(/(s|x|z|ch|sh)es$/.test(v) ? [v.slice(0, -2)] : []), ...(/[^s]s$/.test(v) ? [v.slice(0, -1)] : [])];

// The scale whose steps are exactly the values of an enum, if one.
function scaleOf(enumValues, scales) {
  for (const [scale, steps] of scales) if (enumValues.length >= 2 && enumValues.every((v) => steps.has(v))) return scale;
  return null;
}

export function relationRows(worlds = scanWorlds()) {
  const types = readTypes(worlds);
  const { names, values } = readValues(worlds, types);
  const units = new Map(measureRows(worlds).map((r) => [`${r.world}.${r.type} ${r.key}`, r]));
  // k.values scales and their steps (names in lower case).
  const scales = new Map();
  for (const s of worlds.find((w) => w.id === 'k.values').shards) for (const x of parse(s.text)) if (x.type === 'k.values.step') {
    const sc = tok(x.attrs.scale?.[0]);
    if (!scales.has(sc)) scales.set(sc, new Set());
    scales.get(sc).add(String(tok(x.attrs.name?.[0])).toLowerCase());
  }
  // the types that name things; those keyed by the word whatever it means (k.words, k.parts) only as the last resort
  const byWord = (t) => t.startsWith('k.words.') || NAMED.some((n) => n[0] === t && n[2] === 'word');
  const targets = [...types.entries()].filter(([t, x]) => x.naming && names.get(t)?.size && !byWord(t)).map(([t]) => t).sort(byText);
  const rows = [];
  for (const [t, x] of [...types.entries()].sort((a, b) => byText(a[0], b[0]))) {
    for (const s of x.slots) {
      if (s.key === x.naming) continue;
      const a = s.attrs, kinds = a.kind ?? [], en = (a.enum ?? []).map((v) => String(tok(v)).toLowerCase());
      const row = { world: x.world, type: t, key: s.key, subject: x.word, subject_sense: x.sense, object: null, object_type: [], scale: null, found: 'schema', object_by: null };
      const vals = [...(values.get(`${t} ${s.key}`) ?? [])];
      const join = (pool) => {
        const hits = [];
        for (const u of pool) {
          const n = names.get(u), inter = vals.filter((v) => forms(v).some((f) => n.has(f))).length;
          if (inter && inter * 2 >= vals.length && (inter >= 2 || vals.length === 1)) hits.push([u, inter / vals.length]);
        }
        hits.sort((p, q) => q[1] - p[1] || byText(p[0], q[0]));
        return hits.filter((h) => h[1] >= 0.9 * hits[0][1]).slice(0, 3).map((h) => h[0]);
      };
      if (a.type && a.by) { // a declared join: the source of truth (Q61)
        row.found = 'declared'; row.object_by = a.by[0]; row.object_type = [a.type[0]];
        row.object = KIND_KEYS.has(s.key) ? 'kind' : PLACE_KEYS.has(s.key) ? 'place' : classOfType(a.type[0]);
      } else if (a.type) { row.object = classOfType(a.type[0]) === 'thing' ? 'thing' : classOfType(a.type[0]); row.object_type = [a.type[0]]; }
      else if (kinds.includes('boolean')) row.object = 'boolean';
      else if (kinds.includes('number') || kinds.includes('integer')) row.object = units.get(`${t} ${s.key}`)?.unit ? 'amount' : 'number';
      else if (en.length) {
        row.scale = scaleOf(en, scales);
        const saved = vals.splice(0, vals.length, ...en);
        row.object_type = join(targets);
        if (row.object_type.length) row.found = 'value';
        vals.splice(0, vals.length, ...saved);
        const joined = row.object_type.length ? classOfType(row.object_type[0]) : 'value';
        row.object = KIND_KEYS.has(s.key) ? 'kind' : PLACE_KEYS.has(s.key) ? 'place' : joined === 'thing' ? 'value' : joined;
      } else if (kinds.includes('string') && !kinds.includes('atom')) row.object = 'text';
      else {
        row.object_type = join(targets.filter((u) => u !== t));
        if (!row.object_type.length) row.object_type = join(targets);
        if (!row.object_type.length) row.object_type = join(['k.words.sense'].filter((u) => names.has(u)));
        row.found = 'value';
        row.object = KIND_KEYS.has(s.key) ? 'kind' : PLACE_KEYS.has(s.key) ? 'place' : row.object_type.length ? classOfType(row.object_type[0]) : 'word';
      }
      row.object_sense = [...new Set(row.object_type.map((u) => types.get(u)?.sense).filter(Boolean))];
      rows.push(row);
    }
  }
  return rows;
}

export function argumentsShard() {
  const lines = ARGUMENTS.map((g) => wire(`k.kinds.argument.${seg(g.name)}`, 'k.kinds.argument', [['name', g.name], ['about', text(g.about)], ['live', g.live ? 'true' : undefined],
    ...(g.type ?? []).map((t) => ['type', t]), ...(g.sense ?? []).map((s) => ['sense', s]), ...g.examples.map((e) => ['example', text(e)])], SRC));
  return `${header({ id: 'k.kinds/shards/arguments', about: `the ${ARGUMENTS.length} classes of arguments of the roles of k.actions and of the objects of the relations: the catalog types whose things fill each, and their senses.`,
    sources: ['hand-core 1 (hand-written in this repository: tools/relations-core.mjs)'], license: 'CC0-1.0', script: 'tools/relations-core.mjs' })}\n${lines.join('\n')}\n`;
}

export function relationShards(rows = relationRows()) {
  const line = (r) => wire(`k.kinds.relation.${r.type}.${seg(r.key)}`, 'k.kinds.relation', [['type', r.type], ['key', r.key], ['subject', r.subject], ['subject_sense', r.subject_sense],
    ['object', r.object], ...r.object_type.map((t) => ['object_type', t]), ...r.object_sense.map((s) => ['object_sense', s]), ['scale', r.scale], ['found', r.found], ['object_by', r.object_by]], SRC);
  // one shard per world (relations-animals: the relations of k.animals), so a host that loads a world's facts, or
  // meets the word of one of its keys, loads only that world's relations
  const files = { 'arguments.sop': argumentsShard() };
  for (const w of [...new Set(rows.map((r) => r.world))]) {
    const lines = rows.filter((r) => r.world === w).map(line), name = `relations-${w.slice(2)}`;
    files[`${name}.sop`] = `${header({ id: `k.kinds/shards/${name}`, about: `the keys of the types of ${w} read as relations: ${lines.length} relations, each with the kind of its subject and the class, types and senses of its object (from the joins declared on the slots, by rule from the schemas, and by value from the shards, as found says).`,
      sources: ['hand-core 1 (computed in this repository from the schemas and shards of the knowledge worlds: tools/relations-core.mjs)'], license: 'CC0-1.0', script: 'tools/relations-core.mjs' })}\n${lines.join('\n')}\n`;
  }
  return files;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const files = relationShards();
  const dir = join(WORLDS_DIR, 'k.kinds', 'shards');
  writeShards(dir, { 'arguments.sop': files['arguments.sop'] }, 'arguments');
  writeShards(dir, Object.fromEntries(Object.entries(files).filter(([n]) => n.startsWith('relations-'))), 'relations-');
  for (const [n, t] of Object.entries(files)) console.log(`${n}: ${t.split('\n').filter((l) => l.startsWith('@')).length} wires, ${Buffer.byteLength(t)} bytes`);
}
