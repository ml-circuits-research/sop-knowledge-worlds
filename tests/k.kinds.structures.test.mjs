// Structural descriptions of worlds for alignment (block "21:05" item 4; tools/structures-core.mjs): every world
// schema says which structures it is and casts the roles of each to its types, keys and acts; the knowledge worlds a
// live world makes or reads do the same. From these facts alone two worlds of one structure are aligned role by role
// (the analogy is computed, not hand-paired), and the roles one world casts and the other does not are the
// candidates for a transfer (a default, a rule, a question form) that the library may offer and measure.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR, fullWorld } from '../tools/lib/worlds.mjs';
import { scanSchemas } from '../tools/lib/schemas.mjs';
import { structuresShard, STRUCTURES, FORMS, CONSTRAINTS } from '../tools/structures-core.mjs';
import { parse } from '../tools/sopworld/sopworld.mjs';

const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const file = join(WORLDS_DIR, 'k.kinds', 'shards', 'structures.sop');
const facts = parse(readFileSync(file, 'utf8'));
const one = (w, k) => tok(w.attrs[k]?.[0]);
const all = (w, k) => (w.attrs[k] ?? []).map(tok);
const structures = new Map(facts.filter((w) => w.type === 'k.kinds.structure').map((w) => [one(w, 'name'), w]));
const forms = facts.filter((w) => w.type === 'k.kinds.form');
const casts = facts.filter((w) => w.type === 'k.kinds.cast');
const castOf = (world, structure) => casts.filter((c) => one(c, 'world') === world && one(c, 'structure') === structure);

// The types of a world and the keys of each (own and inherited from types of the same schema or std.schema.thing).
function schemaOf(world) {
  const text = readFileSync(join(WORLDS_DIR, world, 'schema.sop'), 'utf8'), wires = parse(text);
  const types = new Map(wires.filter((w) => w.type === 'core.type').map((w) => [w.attrs.of[0], w.attrs.extends ?? []]));
  const own = (t) => wires.filter((w) => w.type === 'core.slot' && w.attrs.of[0] === t).map((w) => w.attrs.key[0]);
  const keys = (t) => [...own(t), ...(types.get(t) ?? []).flatMap(keys)];
  return { types, keys };
}

// The analogy of two worlds in one structure: for every role both cast with a type, the pairs of their types.
export function align(a, b, structure) {
  const pairs = [];
  for (const role of all(structures.get(structure), 'role')) {
    const fa = castOf(a, structure).filter((c) => one(c, 'role') === role), fb = castOf(b, structure).filter((c) => one(c, 'role') === role);
    for (const x of fa) for (const y of fb) if (one(x, 'as') === one(y, 'as')) pairs.push({ role, a: one(x, 'filler'), b: one(y, 'filler') });
  }
  return pairs;
}

test('the shard is what tools/structures-core.mjs gives, and it loads with k.kinds', () => {
  assert.equal(readFileSync(file, 'utf8'), structuresShard());
  const w = fullWorld('k.kinds');
  assert.equal(w.ofType('k.kinds.structure').length, STRUCTURES.length);
  assert.equal(w.ofType('k.kinds.form').length, FORMS.length);
  assert.equal(w.ofType('k.kinds.constraint').length, CONSTRAINTS.length);
  assert.ok(w.ofType('k.kinds.role').every((r) => r.attrs.many && r.attrs.required));
});

test('every world schema has a structure; every form casts the roles its structure needs, and only roles of it', () => {
  const schemas = scanSchemas().map((s) => s.id);
  const formed = new Set(forms.map((f) => one(f, 'world')));
  assert.deepEqual(schemas.filter((id) => !formed.has(id)), [], 'world schemas without a structure');
  for (const f of forms) {
    const world = one(f, 'world'), s = structures.get(one(f, 'structure'));
    assert.ok(s, `${world}: ${one(f, 'structure')}`);
    assert.ok(existsSync(join(WORLDS_DIR, world, 'schema.sop')), world);
    const cast = castOf(world, one(f, 'structure'));
    for (const r of all(s, 'needs')) assert.ok(cast.some((c) => one(c, 'role') === r), `${world} as ${one(s, 'name')}: no ${r}`);
    for (const c of cast) assert.ok(all(s, 'role').includes(one(c, 'role')), `${world}: ${one(c, 'role')} is no role of ${one(s, 'name')}`);
  }
});

test('every filler is a type of its world, a key of such a type, or an act of k.actions', () => {
  const acts = new Set(parse(readFileSync(join(WORLDS_DIR, 'k.actions', 'shards', 'acts.sop'), 'utf8')).filter((w) => w.type === 'k.actions.act').map((w) => one(w, 'name')));
  for (const c of casts) {
    const world = one(c, 'world'), filler = one(c, 'filler'), as = one(c, 'as'), s = schemaOf(world);
    if (as === 'type') assert.ok(s.types.has(filler), `${world}: type ${filler}`);
    else if (as === 'key') {
      const t = filler.slice(0, filler.lastIndexOf('.')), k = filler.slice(filler.lastIndexOf('.') + 1);
      assert.ok(s.types.has(t) && s.keys(t).includes(k), `${world}: key ${filler}`);
    } else assert.ok(acts.has(filler), `${world}: act ${filler}`);
  }
});

test('analogies are computed from the structures: aligned types, and the roles one world has that the other lacks', () => {
  const has = (pairs, role, a, b) => pairs.some((p) => p.role === role && p.a === a && p.b === b);
  // items in slots: a guest in a seat ~ an event at a time ~ a thing in a slot of a layout
  assert.ok(has(align('w.seating', 'w.timeline', 'assignment'), 'item', 'w.seating.guest', 'w.timeline.event'));
  assert.ok(has(align('w.seating', 'k.layouts', 'assignment'), 'slot', 'w.seating.seat', 'k.layouts.slot'));
  assert.ok(has(align('w.seating', 'k.layouts', 'assignment'), 'container', 'w.seating.table', 'k.layouts.layout'));
  // a whole with parts: a drawing ~ a document ~ a face ~ a chart
  assert.ok(has(align('k.objects', 'w.document', 'whole with parts'), 'part', 'k.objects.part', 'w.document.chapter'));
  assert.ok(has(align('w.face', 'k.objects', 'whole with parts'), 'whole', 'w.face.face', 'k.objects.object'));
  assert.ok(has(align('w.chart', 'w.document', 'whole with parts'), 'part_of', 'w.chart.series.chart', 'w.document.chapter.document'));
  // a sequence: a list item ~ an event ~ a step of a method ~ a month
  assert.ok(has(align('w.list', 'w.timeline', 'sequence'), 'position', 'w.list.item.n', 'w.timeline.event.at'));
  assert.ok(has(align('w.list', 'k.procedures', 'sequence'), 'element', 'w.list.item', 'k.procedures.step'));
  // transfer candidates: what a timeline has and a list lacks (an end, a start and a finish), and the reverse (none)
  const missing = (a, b, s) => all(structures.get(s), 'role').filter((r) => castOf(a, s).some((c) => one(c, 'role') === r) && !castOf(b, s).some((c) => one(c, 'role') === r));
  assert.deepEqual(missing('w.timeline', 'w.list', 'sequence'), ['end', 'start', 'finish']);
  assert.deepEqual(missing('w.list', 'w.timeline', 'sequence'), []);
  // measured: every pair of worlds that share a structure, the types aligned and the roles offered
  let pairs = 0, aligned = 0, offered = 0;
  const byStructure = new Map();
  for (const f of forms) byStructure.set(one(f, 'structure'), [...(byStructure.get(one(f, 'structure')) ?? []), one(f, 'world')]);
  for (const [s, ws] of byStructure) for (let i = 0; i < ws.length; i++) for (let j = 0; j < ws.length; j++) if (i !== j) {
    if (i < j) { pairs++; aligned += align(ws[i], ws[j], s).length; }
    offered += missing(ws[i], ws[j], s).length;
  }
  console.log(`structures ${structures.size}; worlds ${new Set(forms.map((f) => one(f, 'world'))).size}; forms ${forms.length}; casts ${casts.length}; world pairs sharing a structure ${pairs}; aligned filler pairs ${aligned}; roles offered for transfer ${offered}`);
  assert.ok(pairs >= 30 && aligned >= pairs);
});

// The library's Q61 (block 02:00): per role refers / of / many / required, and constraints as facts.
const roles = facts.filter((w) => w.type === 'k.kinds.role');
const roleOf = (structure, name) => roles.find((r) => one(r, 'structure') === structure && one(r, 'name') === name);
const constraints = facts.filter((w) => w.type === 'k.kinds.constraint');

test('Q61: every role says its direction, cardinality and whether it is required; refers and of name roles of its structure', () => {
  for (const [name, s] of structures) {
    const rs = all(s, 'role');
    assert.deepEqual(roles.filter((r) => one(r, 'structure') === name).map((r) => one(r, 'name')), rs, name);
    for (const r of rs.map((x) => roleOf(name, x))) {
      assert.ok(['true', 'false'].includes(one(r, 'many')) && ['true', 'false'].includes(one(r, 'required')), `${name}.${one(r, 'name')}`);
      assert.equal(one(r, 'required') === 'true', all(s, 'needs').includes(one(r, 'name')), `${name}.${one(r, 'name')}: required is needs`);
      for (const k of ['refers', 'of']) if (one(r, k)) assert.ok(rs.includes(one(r, k)) && one(r, k) !== one(r, 'name') || one(r, 'name') === 'next', `${name}.${one(r, 'name')} ${k}=${one(r, k)}`);
      // A key role (of=) that refers is single-valued: one thing names one other.
      if (one(r, 'of') && one(r, 'refers')) assert.equal(one(r, 'many'), 'false', `${name}.${one(r, 'name')}`);
    }
    // The things of a structure go up by refers to a top that refers to nothing (no cycle but next, element to element).
    for (const r of rs) { let x = r, n = 0; while (x && n < 5) { const to = one(roleOf(name, x), 'refers'); if (!to || to === x || one(roleOf(name, x), 'name') === 'next') break; x = to; n += 1; } assert.ok(n < 5, `${name}.${r}: refers cycle`); }
  }
  // The library's examples: a slot refers to its container, the key assigned to the slot; an item has one slot.
  assert.equal(one(roleOf('assignment', 'slot'), 'refers'), 'container');
  assert.deepEqual(['refers', 'of', 'many'].map((k) => one(roleOf('assignment', 'assigned'), k)), ['slot', 'item', 'false']);
  assert.equal(one(roleOf('assignment', 'slot'), 'many'), 'true');
  assert.deepEqual(['refers', 'of'].map((k) => one(roleOf('whole with parts', 'part_of'), k)), ['whole', 'part']);
  // In the worlds, a key cast to a role with of= is a key of the type cast to that of= role (when the world casts it).
  let checked = 0;
  for (const c of casts.filter((x) => one(x, 'as') === 'key')) {
    const of = one(roleOf(one(c, 'structure'), one(c, 'role')), 'of');
    const owners = castOf(one(c, 'world'), one(c, 'structure')).filter((x) => one(x, 'role') === of && one(x, 'as') === 'type').map((x) => one(x, 'filler'));
    if (!of || !owners.length) continue;
    const f = one(c, 'filler');
    if (owners.includes(f.slice(0, f.lastIndexOf('.')))) checked += 1;
  }
  console.log(`roles ${roles.length}; keys of the type cast to their of= role: ${checked}`);
  assert.ok(checked >= 40, `${checked}`);
});

test('Q61: constraints as facts: kind, the role they constrain, the worlds where they hold and the rules that make them hold', () => {
  assert.deepEqual([...new Set(constraints.map((c) => one(c, 'kind')))].sort(), ['capacity', 'distinct', 'order']);
  for (const c of constraints) {
    const s = one(c, 'structure'), on = one(c, 'on');
    assert.ok(all(structures.get(s), 'role').includes(on), `${one(c, 'name')}: ${on}`);
    for (const world of all(c, 'world')) {
      assert.ok(forms.some((f) => one(f, 'world') === world && one(f, 'structure') === s), `${world} is no ${s}`);
      // The world casts the role it constrains, or the key role whose thing it is.
      assert.ok(castOf(world, s).some((x) => one(x, 'role') === on), `${world}: ${on} not cast`);
    }
    // Each rule named by `by` is a wire of the schema of one of its worlds.
    for (const by of all(c, 'by')) assert.ok(all(c, 'world').some((w) => parse(readFileSync(join(WORLDS_DIR, w, 'schema.sop'), 'utf8')).some((x) => x.id === by)), by);
  }
  // Without a rule, the facts hold it: positions are distinct per sequence; no country neighbours itself.
  const facts2 = (world, type) => fullWorld(world).ofType(type);
  for (const [world, type, holder] of [['k.genres', 'k.genres.part', 'genre'], ['k.procedures', 'k.procedures.step', 'method'], ['k.story', 'k.story.element', 'story']]) {
    const seen = new Set();
    for (const f of facts2(world, type)) { const k = `${one(f, holder)}|${one(f, 'n')}`; assert.ok(!seen.has(k), `${world}: ${k} twice`); seen.add(k); }
    assert.ok(seen.size > 5, world);
  }
  assert.ok(facts2('k.geo', 'k.geo.country').every((f) => !all(f, 'neighbour').includes(one(f, 'name'))));
  const by = new Map(constraints.map((c) => [one(c, 'name'), all(c, 'by').length ? 'rule' : 'facts']));
  console.log(`constraints ${constraints.length}: ${[...by].map(([n, b]) => `${n} (${b})`).join(', ')}`);
});
