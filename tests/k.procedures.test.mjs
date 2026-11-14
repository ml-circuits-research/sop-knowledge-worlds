// k.procedures (block "09:10"): methods as facts (format: questions.md Q44). The facts are checked against the
// worlds they name (acts and roles of k.actions, knowledge types and their keys, world schemas and their kinds), and
// each test goal is expanded by the library's planner (sopworld 0.55 std.plan, the one pinned build) into the
// expected list of acts. The reference reader that wrote these lists first (tools/lib/plan.mjs) is gone (one planner,
// no copy; reviewer 12:05).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR, scanWorlds, fullWorld } from '../tools/lib/worlds.mjs';
import { procedureShards, METHODS } from '../tools/procedures-core.mjs';
import { parse, factStore, planner as makePlanner, PlanLive, readMethods, PLAN_LIMITS } from '../tools/sopworld/sopworld.mjs';

// Every published world, k.* and w.* (the world schemas too: the planner takes a schema's kinds from them).
const published = readdirSync(WORLDS_DIR).filter((d) => /^[kw]\./.test(d) && existsSync(join(WORLDS_DIR, d, 'schema.sop'))).sort().map((id) => ({
  id, schemaText: readFileSync(join(WORLDS_DIR, id, 'schema.sop'), 'utf8'),
  shards: existsSync(join(WORLDS_DIR, id, 'shards')) ? readdirSync(join(WORLDS_DIR, id, 'shards')).filter((f) => f.endsWith('.sop')).sort().map((f) => ({ id: `${id}/shards/${f.slice(0, -4)}`, text: readFileSync(join(WORLDS_DIR, id, 'shards', f), 'utf8') })) : [],
}));
const worlds = scanWorlds();
const knowledge = factStore(published);
// The chain of kinds the methods compare by (what std.know follows for a host): is_a, kind_of, the `is` of a role,
// the age of a kind of person, and the drawing of a person.
const KIND_KEYS = ['is_a', 'kind_of', 'is', 'age'];
const chain = [{ type: 'k.people.kind', keys: [...KIND_KEYS, 'drawing'] }, { type: 'k.people.role', keys: [...KIND_KEYS, 'drawing'] }, { type: 'k.commonsense.thing', keys: KIND_KEYS }, { type: 'k.shapes.shape', keys: KIND_KEYS }];
const planner = makePlanner(knowledge, { chain });
const methods = readMethods(knowledge);
const MAX_ACTS = PLAN_LIMITS.acts;

// The kinds of a world schema by their plain name (table -> w.seating.table), and the slots of each (for the checks).
function schemaKinds(id) {
  const file = join(WORLDS_DIR, id, 'schema.sop');
  if (!existsSync(file)) return null;
  const wires = parse(readFileSync(file, 'utf8'));
  const types = wires.filter((x) => x.type === 'core.type').map((x) => x.attrs.of[0]);
  const parent = Object.fromEntries(wires.filter((x) => x.type === 'core.type').map((x) => [x.attrs.of[0], x.attrs.extends ?? []]));
  const own = (t) => wires.filter((x) => x.type === 'core.slot' && x.attrs.of[0] === t).map((x) => x.attrs.key[0]);
  const slots = (t) => [...own(t), ...(parent[t] ?? []).flatMap(slots)];
  return { kinds: Object.fromEntries(types.map((t) => [t.slice(id.length + 1), t])), slots: Object.fromEntries(types.map((t) => [t, slots(t)])) };
}
// A live world for planning (std.plan's PlanLive), with the schema of its world for the checks.
class Live extends PlanLive {
  constructor(o = {}) { super({ store: knowledge, ...o }); this.schema = o.world?.startsWith('w.') ? schemaKinds(o.world) : null; }
}
const plan = (goal, live = new Live()) => planner.plan(goal, live);
const thing = (id, kind) => ({ id, kind });
// The steps of a method in an order their `after` allows (a circle is an error).
const order = (m) => {
  const done = new Set(), left = [...m.steps];
  while (left.length) {
    const i = left.findIndex((s) => s.after.every((a) => done.has(a)));
    assert.ok(i >= 0, `${m.name}: steps in a circle`);
    done.add(left.splice(i, 1)[0].n);
  }
};

test('the shards are what tools/procedures-core.mjs gives, and they load', () => {
  for (const [name, t] of Object.entries(procedureShards())) assert.equal(readFileSync(join(WORLDS_DIR, 'k.procedures', 'shards', name), 'utf8'), t, name);
  const w = fullWorld('k.procedures', worlds);
  assert.equal(w.ofType('k.procedures.method').length, METHODS.length);
  assert.equal(methods.length, METHODS.length);
});

test('every act is an act of k.actions, every role a role of its act', () => {
  const acts = new Set(knowledge.facts('k.actions.act').map((f) => f.attrs.name[0]));
  const roles = new Set(knowledge.facts('k.actions.role').map((f) => `${f.attrs.act[0]} ${f.attrs.name[0]}`));
  assert.equal(acts.size, 16);
  for (const m of methods) {
    assert.ok(acts.has(m.act), `${m.name}: act ${m.act}`);
    for (const r of Object.keys(m.goal)) assert.ok(roles.has(`${m.act} ${r}`), `${m.name}: goal role ${r} of ${m.act}`);
    for (const s of m.steps) {
      assert.ok(acts.has(s.act), `${m.name} ${s.n}: act ${s.act}`);
      for (const a of s.args) assert.ok(roles.has(`${s.act} ${a.role}`), `${m.name} ${s.n}: role ${a.role} of ${s.act}`);
      for (const a of s.args.filter((x) => x.attribute)) assert.equal(a.role, 'value', `${m.name} ${s.n}: an attribute is set through the role value`);
    }
  }
});

test('bindings: one source each; every name used is bound; knowledge types and keys exist', () => {
  const types = new Map();
  for (const w of worlds) for (const line of w.schemaText.split('\n')) {
    const m = /core\.slot of=(\S+) key=(\S+)/.exec(line);
    if (m) { if (!types.has(m[1])) types.set(m[1], new Set()); types.get(m[1]).add(m[2]); }
  }
  // the slots of a type and of every type it extends (its parent and its slot groups: k.named.labelled gives named)
  const slotsOf = (t) => { const s = new Set(types.get(t) ?? []); for (const w of worlds) { const m = new RegExp(`core\\.type of=${t.replace(/\./g, '\\.')}( [^\\n]*)`).exec(w.schemaText); if (m) for (const [, p] of m[1].matchAll(/ extends=(\S+)/g)) for (const k of slotsOf(p)) s.add(k); } return s; };
  for (const m of methods) {
    const has = (n, what) => assert.ok(m.bind[n], `${m.name}: ${what} names no binding: ${n}`);
    for (const [n, bd] of Object.entries(m.bind)) {
      const sources = [bd.goal, bd.step.length ? 1 : undefined, bd.from, bd.live, bd.history || undefined, bd.upto, bd.together.length ? 1 : undefined, bd.value].filter((x) => x !== undefined);
      assert.equal(sources.length, 1, `${m.name}: binding ${n} has ${sources.length} sources`);
      if (bd.goal) assert.ok(m.goal[bd.goal], `${m.name}: ${n} reads goal role ${bd.goal}, which the goal does not name`);
      for (const s of bd.step) assert.ok(m.steps.some((x) => x.n === s), `${m.name}: ${n} reads step ${s}`);
      if (bd.upto) has(bd.upto, 'upto');
      for (const t of bd.together) has(t, 'together');
      if (bd.from) {
        assert.ok(types.has(bd.from), `${m.name}: ${n} from ${bd.from}: no such type`);
        const keys = slotsOf(bd.from);
        if (bd.key) assert.ok(keys.has(bd.key), `${m.name}: ${n} key ${bd.key} of ${bd.from}`);
        for (const k of Object.keys(bd.match)) assert.ok(keys.has(k), `${m.name}: ${n} matches ${k}, no key of ${bd.from}`);
      }
      for (const t of Object.values(bd.match)) if (t.equals) has(t.equals, 'match');
    }
    for (const g of Object.values(m.goal)) if (g.from) { assert.ok(types.has(g.from), `${m.name}: goal from ${g.from}`); if (g.by) assert.ok(slotsOf(g.from).has(g.by), `${m.name}: goal by ${g.by}`); }
    for (const s of m.steps) {
      if (s.each) has(s.each, `step ${s.n} each`);
      for (const a of s.after) assert.ok(a < s.n || m.steps.some((x) => x.n === a), `${m.name} ${s.n}: after ${a}`);
      for (const a of s.args) {
        if (a.binding) has(a.binding, `step ${s.n} arg ${a.role}`); else assert.ok(a.value !== undefined, `${m.name} ${s.n}: arg ${a.role} has no filler`);
        if (a.of) has(a.of, `step ${s.n} of`);
        const bd = a.binding && m.bind[a.binding];
        if (bd?.from && a.key) assert.ok(slotsOf(bd.from).has(a.key), `${m.name} ${s.n}: key ${a.key} of ${bd.from}`);
      }
    }
    for (const c of m.conditions) {
      has(c.thing, `condition ${c.n}`); if (c.other) has(c.other, `condition ${c.n}`);
      if (c.step) assert.ok(m.steps.some((x) => x.n === c.step), `${m.name}: condition on step ${c.step}`);
    }
    if (m.world) assert.ok(schemaKinds(m.world), `${m.name}: world ${m.world} is no schema here`);
    assert.ok(m.example.length > 0, `${m.name}: an example`);
    order(m); // no circle
  }
});

// A plan in a live world of a schema makes only kinds of that schema, with attributes it has.
const checkWorld = (r, live) => {
  if (!live.schema) return;
  for (const a of r.acts.filter((x) => x.act === 'make')) {
    const kind = live.kinds[a.args.find((x) => x.role === 'kind').vals[0]];
    assert.ok(kind, `${live.world}: no kind ${a.args.find((x) => x.role === 'kind').vals[0]}`);
    for (const x of a.args.filter((y) => y.attribute)) assert.ok(live.schema.slots[kind].includes(x.attribute), `${kind} has no ${x.attribute}`);
  }
};
const expect = (goal, live, method, lines) => {
  const r = plan(goal, live);
  assert.equal(r.method, method, JSON.stringify(r.tried ?? r.asks));
  assert.deepEqual(r.lines, lines);
  for (const e of r.effects) assert.ok(e.ok, `effect ${e.method}: ${e.fact} ${e.thing}`);
  checkWorld(r, live);
  return r;
};

test('draw a farm: the farm scene of k.scenes, ground first, the farmer dressed, the ducks on the pond', () => {
  const r = expect({ act: 'make', roles: { kind: 'farm' } }, new Live(), 'compose a scene', [
    'make kind=grass place=ground',
    'make kind=sun number=1 place=sky', 'make kind=cloud number=2 place=sky',
    'make kind=barn number=1 place=background', 'make kind=farmhouse number=1 place=background', 'make kind=field number=1 place=background',
    'make kind=tree number=2 place=background', 'make kind=scarecrow number=1 place=background',
    'make kind=tractor number=1 place=ground', 'make kind=fence number=2 place=ground', 'make kind=cow number=3 place=ground',
    'make kind=pig number=2 place=ground', 'make kind=sheep number=4 place=ground', 'make kind=horse number=1 place=ground',
    'make kind=goat number=1 place=ground', 'make kind=hen number=4 place=ground', 'make kind=rooster number=1 place=ground',
    'make kind=pond number=1 place=ground', 'make kind=dog number=1 place=ground', 'make kind=cat number=1 place=ground',
    'make kind=farmer number=1 place=ground',
    'make kind=wellington boots place=feet of=farmer1 rel=on', 'make kind=hat place=head of=farmer1 rel=on', 'make kind=rake place=right_hand of=farmer1 rel=in',
    'make kind=hay number=2 place=ground', 'make kind=wheelbarrow number=1 place=ground',
    'make kind=duck number=2', 'place thing=duck1,duck2 place=water of=pond1 rel=on',
  ]);
  assert.deepEqual([...new Set(r.methods)], ['compose a scene', 'a person of a role', 'put on a new wearable', 'make a thing on the anchor of another']);
});

test('a person sitting on a swing: make the swing, make the person, put it on the seat; an existing swing is used', () => {
  expect({ act: 'make', roles: { kind: 'person', place: { value: 'swing', rel: 'on' } } }, new Live(), 'make a thing on the anchor of another',
    ['make kind=swing', 'make kind=person', 'place thing=person1 place=seat of=swing1 rel=on']);
  expect({ act: 'make', roles: { kind: 'girl', place: { value: 'swing', rel: 'on' } } }, new Live({ things: [thing('swing1', 'swing')] }), 'make a thing on the anchor of another',
    ['make kind=girl', 'place thing=girl1 place=seat of=swing1 rel=on']);
  expect({ act: 'place', roles: { thing: 'man1', place: { value: 'bench', rel: 'on' } } }, new Live({ things: [thing('man1', 'man')] }), 'put a thing on the anchor of another',
    ['make kind=bench', 'place thing=man1 place=seat of=bench1 rel=on']);
  expect({ act: 'make', roles: { kind: 'cup', place: { value: 'table1', rel: 'on' } } }, new Live({ things: [thing('table1', 'table')] }), 'make a thing on the anchor of another',
    ['make kind=cup', 'place thing=cup1 place=surface of=table1 rel=on']);
});

test('a family photo: the people there arranged, or a new family when there is nobody (alternatives by precondition)', () => {
  expect({ act: 'make', roles: { kind: 'family photo' } }, new Live(), 'a family photo of a new family', [
    'make kind=man', 'make kind=woman', 'make kind=boy', 'make kind=girl', 'make kind=dog',
    'group thing=man1,woman1,boy1,girl1,dog1 group=family photo',
    'place thing=man1 place=back_row of=group1 rel=in', 'place thing=woman1 place=back_row of=group1 rel=in',
    'place thing=boy1 place=front_row of=group1 rel=in', 'place thing=girl1 place=front_row of=group1 rel=in', 'place thing=dog1 place=pet of=group1 rel=in',
  ]);
  const r = expect({ act: 'make', roles: { kind: 'family photo' } }, new Live({ things: [thing('grandmother1', 'grandmother'), thing('boy1', 'boy'), thing('tree1', 'tree')] }), 'a family photo of the people there', [
    'group thing=grandmother1,boy1 group=family photo',
    'place thing=grandmother1 place=back_row of=group1 rel=in', 'place thing=boy1 place=front_row of=group1 rel=in',
  ]);
  assert.deepEqual(r.methods, ['a family photo of the people there', 'arrange in a layout']);
});

test('set a table for four: chairs around, plates and cups on top in a picture; a table with four seats in w.seating', () => {
  expect({ act: 'make', roles: { kind: 'table setting', number: 4 } }, new Live(), 'set a table', [
    'make kind=table', 'make kind=chair number=4 place=table1 rel=around', 'make kind=plate number=4 place=surface of=table1 rel=on', 'make kind=cup number=4 place=surface of=table1 rel=on',
  ]);
  expect({ act: 'make', roles: { kind: 'table setting', number: 2 } }, new Live({ things: [thing('table1', 'table')] }), 'set a table', [
    'make kind=chair number=2 place=table1 rel=around', 'make kind=plate number=2 place=surface of=table1 rel=on', 'make kind=cup number=2 place=surface of=table1 rel=on',
  ]);
  expect({ act: 'make', roles: { kind: 'table setting', number: 4 } }, new Live({ world: 'w.seating' }), 'set a table in a seating plan', [
    'make kind=w.seating.table name=table seats=4',
    'make kind=w.seating.seat table=table1 n=1', 'make kind=w.seating.seat table=table1 n=2', 'make kind=w.seating.seat table=table1 n=3', 'make kind=w.seating.seat table=table1 n=4',
  ]);
  // with no number said, four
  assert.equal(plan({ act: 'make', roles: { kind: 'table setting' } }).lines[1], 'make kind=chair number=4 place=table1 rel=around');
});

test('take apart a car: the parts of its drawing that have a name; a piano by the parts k.parts names; a group by the act', () => {
  expect({ act: 'take apart', roles: { thing: 'car1' } }, new Live({ things: [thing('car1', 'car')] }), 'take apart a drawn thing', [
    'make kind=window place=left_window of=car1 rel=at', 'make kind=window place=right_window of=car1 rel=at',
    'make kind=wheel place=left_wheel of=car1 rel=at', 'make kind=wheel place=right_wheel of=car1 rel=at',
  ]);
  expect({ act: 'take apart', roles: { thing: 'piano1' } }, new Live({ things: [thing('piano1', 'piano')] }), 'take apart into named parts', [
    'make kind=fallboard', 'make kind=keyboard', 'make kind=piano action', 'make kind=piano keyboard', 'make kind=soft pedal', 'make kind=sounding board', 'make kind=sustaining pedal', 'remove thing=piano1',
  ]);
  expect({ act: 'take apart', roles: { thing: 'group1' } }, new Live({ things: [{ id: 'group1', kind: 'group', members: [] }] }), 'take apart a group', ['take_apart thing=group1']);
  const none = plan({ act: 'take apart', roles: { thing: 'idea1' } }, new Live({ things: [thing('idea1', 'idea')] }));
  assert.ok(none.refused, 'an idea has no parts: refused');
  assert.ok(none.tried.some((t) => t.method === 'take apart a drawn thing'));
});

test('build a house from parts: make the parts k.layouts joins name, join those that attach, group them', () => {
  expect({ act: 'make', roles: { kind: 'house', material: 'parts' } }, new Live(), 'build from parts', [
    'make kind=roof', 'make kind=wall', 'make kind=door', 'make kind=window', 'make kind=chimney',
    'connect thing=roof1 target=wall1', 'connect thing=chimney1 target=roof1', 'group thing=roof1,wall1,door1,window1,chimney1 group=house',
  ]);
});

test('a chart of the things in the picture (w.list); a report about what we did (w.timeline, or w.list)', () => {
  expect({ act: 'make', roles: { kind: 'chart' } }, new Live({ world: 'w.list', things: [thing('tree1', 'tree'), thing('tree2', 'tree'), thing('sun1', 'sun')] }), 'a chart of the things there', [
    'ask topic=count thing=tree1,tree2,sun1', 'make kind=w.list.list name=chart',
    'make kind=w.list.item text=sun quantity=1 list=list1', 'make kind=w.list.item text=tree quantity=2 list=list1',
  ]);
  const history = [{ act: 'make', thing: 'tree1' }, { act: 'change', thing: 'tree1' }, { act: 'remove', thing: 'sun1' }];
  expect({ act: 'make', roles: { kind: 'report' } }, new Live({ world: 'w.timeline', history }), 'a report on a timeline', [
    'make kind=w.timeline.timeline name=report',
    'make kind=w.timeline.event title=make about=tree1 at=1 timeline=timeline1', 'make kind=w.timeline.event title=change about=tree1 at=2 timeline=timeline1', 'make kind=w.timeline.event title=remove about=sun1 at=3 timeline=timeline1',
  ]);
  expect({ act: 'make', roles: { kind: 'report' } }, new Live({ world: 'w.list', history }), 'a report as a list', [
    'make kind=w.list.list name=report',
    'make kind=w.list.item text=make note=tree1 n=1 list=list1', 'make kind=w.list.item text=change note=tree1 n=2 list=list1', 'make kind=w.list.item text=remove note=sun1 n=3 list=list1',
  ]);
  assert.ok(plan({ act: 'make', roles: { kind: 'report' } }, new Live({ world: 'w.timeline' })).refused, 'nothing done yet: no report');
});

test('a person of a role in a picture and on a face (w.face); a feeling on a face; a wearable on a person or a face', () => {
  expect({ act: 'make', roles: { kind: 'doctor' } }, new Live(), 'a person of a role', [
    'make kind=doctor', 'make kind=lab coat place=body of=doctor1 rel=on', 'make kind=stethoscope place=right_hand of=doctor1 rel=in',
  ]);
  expect({ act: 'make', roles: { kind: 'pirate' } }, new Live({ world: 'w.face' }), 'a face of a role', [
    'make kind=w.face.face', 'make kind=w.face.hat variant=pirate hat face=face1', 'make kind=w.face.beard variant=full face=face1', 'make kind=w.face.moustache variant=handlebar face=face1',
  ]);
  expect({ act: 'change', roles: { thing: 'face1', value: 'shy' } }, new Live({ world: 'w.face', things: [thing('face1', 'face')] }), 'show a feeling on a face', [
    'change thing=mouth of=face1 attribute=variant value=small', 'change thing=eyebrows of=face1 attribute=variant value=sad',
    'change thing=eyes of=face1 attribute=variant value=downcast', 'change thing=cheeks of=face1 attribute=variant value=blush',
  ]);
  expect({ act: 'change', roles: { thing: 'face1', value: 'hurt' } }, new Live({ world: 'w.face', things: [thing('face1', 'face')] }), 'show a feeling on a face', [
    'change thing=face1 attribute=expression value=sad', 'change thing=cheeks of=face1 attribute=variant value=tear',
  ]);
  expect({ act: 'make', roles: { kind: 'hat', place: { value: 'man1', rel: 'on' } } }, new Live({ things: [thing('man1', 'man')] }), 'put on a new wearable', ['make kind=hat place=head of=man1 rel=on']);
  expect({ act: 'place', roles: { thing: 'scarf1', place: { value: 'girl1', rel: 'on' } } }, new Live({ things: [thing('girl1', 'girl'), thing('scarf1', 'scarf')] }), 'put on a wearable', ['place thing=scarf1 place=neck of=girl1 rel=on']);
  expect({ act: 'make', roles: { kind: 'cap', place: { value: 'face1' } } }, new Live({ world: 'w.face', things: [thing('face1', 'face')] }), 'put a wearable on a face', ['make kind=w.face.hat variant=cap face=face1']);
});

test('a place on the map (w.map): a country highlighted, a city pinned, the view centred; nothing shown twice', () => {
  expect({ act: 'ask', roles: { thing: 'Peru' } }, new Live({ world: 'w.map' }), 'show a country on the map', ['make kind=w.map.place name=Peru sort=country highlight=true', 'change thing=view attribute=centre value=Peru']);
  expect({ act: 'ask', roles: { thing: 'Lima' } }, new Live({ world: 'w.map' }), 'show a city on the map', ['make kind=w.map.pin on=Lima sort=city label=Lima', 'change thing=view attribute=centre value=Lima']);
  expect({ act: 'ask', roles: { thing: 'Peru' } }, new Live({ world: 'w.map', things: [{ id: 'place1', kind: 'place', attrs: { name: 'Peru' } }] }), 'show a country on the map', ['change thing=view attribute=centre value=Peru']);
  assert.ok(plan({ act: 'ask', roles: { thing: 'Peru' } }).refused, 'only in a map');
});

test('arrange things in a layout: a row, and refusal reasons; a needed role missing is asked', () => {
  expect({ act: 'group', roles: { thing: ['tree1', 'house1'], group: 'row' } }, new Live({ things: [thing('tree1', 'tree'), thing('house1', 'house')] }), 'arrange in a layout',
    ['group thing=tree1,house1 group=row', 'place thing=tree1 place=item of=group1 rel=in', 'place thing=house1 place=item of=group1 rel=in']);
  const r = plan({ act: 'group', roles: { group: 'row' } });
  assert.deepEqual(r.asks, ['thing']);
});

test('every method is reached by a test goal above (the test file names each method)', () => {
  const text = readFileSync(new URL(import.meta.url), 'utf8');
  for (const m of methods) assert.ok(text.includes(`'${m.name}'`), m.name);
});

// Coverage: each general method over all the knowledge it reads. Counted, with what is left out.
test('coverage: every scene, role, wearable, layout, joined whole and labelled drawing gives a plan within the budget', () => {
  const report = {};
  const run = (name, goals) => {
    let ok = 0, acts = 0, max = 0, skipped = 0;
    const bad = [];
    for (const [g, live] of goals) {
      const r = plan(g, live());
      if (r.refused || r.truncated || r.asks.length || !r.lines.length || r.effects.some((e) => !e.ok)) { bad.push(JSON.stringify(g.roles)); continue; }
      ok++; acts += r.lines.length; max = Math.max(max, r.lines.length); skipped += r.skipped.length;
      checkWorld(r, live());
    }
    report[name] = { goals: goals.length, ok, acts, max, skipped, bad: bad.slice(0, 5) };
    assert.ok(max <= MAX_ACTS);
    return report[name];
  };
  const names = (type, key = 'name') => [...new Set(knowledge.facts(type).flatMap((f) => f.attrs[key] ?? []))];
  const pic = () => new Live();
  const scenes = run('scenes', names('k.scenes.scene').map((s) => [{ act: 'make', roles: { kind: s } }, pic]));
  assert.equal(scenes.ok, scenes.goals, scenes.bad.join(' '));
  const roles = run('roles', names('k.people.role').map((s) => [{ act: 'make', roles: { kind: s } }, pic]));
  assert.equal(roles.ok, roles.goals, roles.bad.join(' '));
  const faces = run('roles on a face', names('k.people.role').map((s) => [{ act: 'make', roles: { kind: s } }, () => new Live({ world: 'w.face' })]));
  assert.equal(faces.ok, faces.goals);
  const wear = run('wearables on a person', names('k.wearables.wearable').map((s) => [{ act: 'make', roles: { kind: s, place: { value: 'person1', rel: 'on' } } }, () => new Live({ things: [thing('person1', 'person')] })]));
  assert.equal(wear.ok, wear.goals, wear.bad.join(' '));
  const feel = run('feelings on a face', names('k.feelings.feeling').map((s) => [{ act: 'change', roles: { thing: 'face1', value: s } }, () => new Live({ world: 'w.face', things: [thing('face1', 'face')] })]));
  assert.equal(feel.ok, feel.goals);
  const layouts = run('layouts', names('k.layouts.layout').map((s) => [{ act: 'group', roles: { thing: ['man1', 'girl1', 'tree1'], group: s } }, () => new Live({ things: [thing('man1', 'man'), thing('girl1', 'girl'), thing('tree1', 'tree')] })]));
  assert.equal(layouts.ok, layouts.goals);
  const wholes = run('built from parts', [...new Set(knowledge.facts('k.layouts.joins').filter((f) => f.attrs.rel[0] === 'part_of').map((f) => f.attrs.b[0]))].map((s) => [{ act: 'make', roles: { kind: s, material: 'parts' } }, pic]));
  assert.equal(wholes.ok, wholes.goals);
  const drawn = [...new Set(knowledge.facts('k.objects.part').filter((f) => (f.attrs.kind && f.attrs.kind[0] !== 'detail') || f.attrs.named).map((f) => f.attrs.of[0]))];
  const apart = run('labelled drawings taken apart', drawn.map((s) => [{ act: 'take apart', roles: { thing: 'x1' } }, () => new Live({ things: [thing('x1', s)] })]));
  assert.equal(apart.ok, apart.goals, apart.bad.join(' '));
  console.log(`coverage ${JSON.stringify(report)}`);
});
