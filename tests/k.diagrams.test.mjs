// k.diagrams (block "04:40"): the kinds of diagram as knowledge, joined to w.diagram (forms, layouts, roles, shapes),
// to k.layouts (arrangements), to k.kinds (structures) and to the catalog's knowledge that fills each; and two
// diagrams built from that knowledge alone in a w.diagram session (the frog's life cycle, a method as a flowchart).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR, factsOf, scanWorlds } from '../tools/lib/worlds.mjs';
import { actsWorld } from '../tools/lib/schemas.mjs';
import { SHARD, shardText, KINDS } from '../tools/diagrams-core.mjs';

const worlds = scanWorlds();
const unq = (v) => String(v).replace(/^"|"$/g, '');
const one = (f, k) => (f.attrs[k] ? unq(f.attrs[k][0]) : undefined);
const all = (f, k) => (f.attrs[k] ?? []).map(unq);
const kinds = factsOf('k.diagrams', 'k.diagrams.kind', worlds);
const shapes = factsOf('k.diagrams', 'k.diagrams.shape', worlds);
const fills = factsOf('k.diagrams', 'k.diagrams.fill', worlds);
const sources = new Set(factsOf('k.diagrams', 'k.diagrams.source', worlds).map((f) => one(f, 'name')));
const diagramSchema = readFileSync(join(WORLDS_DIR, 'w.diagram', 'schema.sop'), 'utf8');
const enumOf = (text, slot) => [...new RegExp(`^@${slot.replace(/\./g, '\\.')} core\\.slot .*$`, 'm').exec(text)[0].matchAll(/ enum=(\S+)/g)].map((m) => m[1]);
const schemaText = worlds.map((w) => w.schemaText).join('\n');

test('the shard is what tools/diagrams-core.mjs writes; ten kinds, each with its sources', () => {
  assert.equal(readFileSync(SHARD, 'utf8'), shardText());
  assert.equal(kinds.length, 10);
  assert.deepEqual(kinds.map((k) => one(k, 'name')).sort(), KINDS.map((k) => k[0]).sort());
  for (const f of [...kinds, ...shapes]) for (const s of all(f, 'source')) assert.ok(sources.has(s), `${f.id}: ${s}`);
});

test('joins: forms, layouts, roles and shapes are values of w.diagram; arrangements are k.layouts layouts; structures are k.kinds structures', () => {
  const forms = enumOf(diagramSchema, 'w.diagram.diagram.form'), layouts = enumOf(diagramSchema, 'w.diagram.diagram.layout');
  const roles = enumOf(diagramSchema, 'w.diagram.node.role'), shapeValues = enumOf(diagramSchema, 'w.diagram.node.shape');
  const arrangements = new Set(factsOf('k.layouts', 'k.layouts.layout', worlds).map((f) => one(f, 'name')));
  const structures = new Set(factsOf('k.kinds', 'k.kinds.structure', worlds).map((f) => one(f, 'name')));
  assert.deepEqual(kinds.map((k) => one(k, 'form')).sort(), [...forms].sort(), 'one kind per form of w.diagram');
  for (const k of kinds) {
    for (const l of all(k, 'layout')) assert.ok(layouts.includes(l), `${one(k, 'name')} layout ${l}`);
    for (const r of all(k, 'role')) assert.ok(roles.includes(r), `${one(k, 'name')} role ${r}`);
    for (const a of all(k, 'arranged')) assert.ok(arrangements.has(a), `${one(k, 'name')} arranged ${a}`);
    for (const s of all(k, 'structure')) assert.ok(structures.has(s), `${one(k, 'name')} structure ${s}`);
  }
  assert.ok(structures.has('cycle'), 'k.kinds has the structure cycle');
  for (const s of shapes) assert.ok(shapeValues.includes(one(s, 'shape')), s.id);
});

test('every role of every kind has its usual shape; the flowchart\'s are ISO 5807\'s', () => {
  for (const k of kinds) for (const r of all(k, 'role')) assert.ok(shapes.some((s) => one(s, 'kind') === one(k, 'name') && one(s, 'role') === r), `${one(k, 'name')} ${r}`);
  for (const s of shapes) assert.ok(all(kinds.find((k) => one(k, 'name') === one(s, 'kind')), 'role').includes(one(s, 'role')), s.id);
  const flow = Object.fromEntries(shapes.filter((s) => one(s, 'kind') === 'flowchart').map((s) => [one(s, 'role'), one(s, 'shape')]));
  assert.deepEqual([flow.start, flow.end, flow.process, flow.decision, flow.data], ['oval', 'oval', 'rectangle', 'diamond', 'parallelogram']);
  for (const s of shapes.filter((x) => one(x, 'kind') === 'flowchart')) assert.deepEqual(all(s, 'source'), ['iso5807']);
});

test('what fills each kind: a type and key the catalog declares, with facts; every kind but the org chart has a fill', () => {
  for (const f of fills) {
    const type = one(f, 'type'), key = one(f, 'key'), world = type.split('.').slice(0, 2).join('.');
    assert.match(schemaText, new RegExp(`^@${type.replace(/\./g, '\\.')} core\\.type `, 'm'), type);
    // the key: a slot of the type, or of a type it extends
    const parents = [type, ...[...schemaText.matchAll(new RegExp(`^@${type.replace(/\./g, '\\.')} core\\.type .*extends=(\\S+)`, 'gm'))].map((m) => m[1])];
    assert.ok(parents.some((t) => new RegExp(`^@${t.replace(/\./g, '\\.')}\\.${key} core\\.slot `, 'm').test(schemaText)), `${type}.${key}`);
    const subtypes = [type, ...[...schemaText.matchAll(new RegExp(`^@(\\S+) core\\.type .*extends=${type.replace(/\./g, '\\.')}( |$)`, 'gm'))].map((m) => m[1])];
    assert.ok(factsOf(world, subtypes, worlds).some((x) => x.attrs[key]), `facts of ${type} with ${key}`);
    if (one(f, 'topic')) assert.ok(parents.some((t) => new RegExp(`^@${t.replace(/\./g, '\\.')}\\.${one(f, 'topic')} core\\.slot `, 'm').test(schemaText)), `${type} topic ${one(f, 'topic')}`);
  }
  const without = kinds.map((k) => one(k, 'name')).filter((n) => !fills.some((f) => one(f, 'kind') === n));
  assert.deepEqual(without, ['org chart'], 'no world of the catalog says who reports to whom');
});

// A diagram from the knowledge alone: the kind gives form, layout, role and shape; the fill gives nodes and edges.
const kindOf = (name) => kinds.find((k) => one(k, 'name') === name);
const shapeOf = (kind, role) => one(shapes.find((s) => one(s, 'kind') === kind && one(s, 'role') === role), 'shape');

test('a cycle diagram of the frog\'s life cycle, from k.time\'s stages through k.diagrams', () => {
  const kind = kindOf('cycle');
  const fill = fills.find((f) => one(f, 'kind') === 'cycle' && one(f, 'key') === 'next');
  const stages = factsOf('k.time', 'k.time.stage', worlds).filter((s) => one(s, one(fill, 'topic')) === 'frog life cycle').sort((a, b) => one(a, 'n') - one(b, 'n'));
  const w = actsWorld(['w.diagram']), act = (a, args) => w.act({ action: a, args });
  assert.equal(act('make', { kind: 'w.diagram.diagram', title: 'frog life cycle', form: one(kind, 'form'), layout: all(kind, 'layout')[0], topic: 'frog' }).ok, true);
  const role = all(kind, 'role')[0];
  const node = {};
  for (const s of stages) node[one(s, 'name')] = act('make', { kind: 'w.diagram.node', label: one(s, 'name'), role, shape: shapeOf('cycle', role), n: Number(one(s, 'n')), diagram: '$w_diagram_diagram1' }).result.thing;
  for (const s of stages) assert.equal(act('make', { kind: 'w.diagram.edge', from: `$${node[one(s, 'name')]}`, to: `$${node[one(s, one(fill, 'key'))]}`, direction: one(kind, 'edges') === 'directed' ? 'forward' : 'none', diagram: '$w_diagram_diagram1' }).ok, true);
  assert.deepEqual(stages.map((s) => one(s, 'name')), ['egg', 'tadpole', 'frog']);
  assert.equal(act('pick', { kind: 'w.diagram.edge' }).result.things.length, 3);
  assert.equal(act('ask', { thing: 'w_diagram_diagram1', attr: 'layout' }).result.value, 'circular');
  assert.equal(act('ask', { thing: node.frog, attr: 'shape' }).result.value, 'circle');
  // the edge from the last stage goes back to the first: the cycle closes
  assert.equal(act('ask', { thing: 'w_diagram_edge3', attr: 'to' }).result.value, `$${node.egg}`);
});

test('a flowchart of a method of k.procedures: its steps as process nodes, an arrow from each step it comes after', () => {
  const kind = kindOf('flowchart');
  const steps = factsOf('k.procedures', 'k.procedures.step', worlds).filter((s) => one(s, 'method') === 'compose a scene').sort((a, b) => one(a, 'n') - one(b, 'n'));
  assert.ok(steps.length >= 3);
  const w = actsWorld(['w.diagram']), act = (a, args) => w.act({ action: a, args });
  act('make', { kind: 'w.diagram.diagram', title: 'compose a scene', form: one(kind, 'form'), layout: all(kind, 'layout')[0] });
  const node = {};
  node.start = act('make', { kind: 'w.diagram.node', label: 'start', role: 'start', shape: shapeOf('flowchart', 'start'), diagram: '$w_diagram_diagram1' }).result.thing;
  for (const s of steps) node[one(s, 'n')] = act('make', { kind: 'w.diagram.node', label: one(s, 'about'), role: 'process', shape: shapeOf('flowchart', 'process'), n: Number(one(s, 'n')), diagram: '$w_diagram_diagram1' }).result.thing;
  node.end = act('make', { kind: 'w.diagram.node', label: 'end', role: 'end', shape: shapeOf('flowchart', 'end'), diagram: '$w_diagram_diagram1' }).result.thing;
  const edges = [];
  for (const s of steps) {
    const after = all(s, 'after');
    for (const a of after.length ? after : ['start']) edges.push([node[a], node[one(s, 'n')]]);
  }
  const last = steps.filter((s) => !steps.some((x) => all(x, 'after').includes(one(s, 'n'))));
  for (const s of last) edges.push([node[one(s, 'n')], node.end]);
  for (const [from, to] of edges) assert.equal(act('make', { kind: 'w.diagram.edge', from: `$${from}`, to: `$${to}`, diagram: '$w_diagram_diagram1' }).ok, true);
  assert.equal(act('pick', { kind: 'w.diagram.node' }).result.things.length, steps.length + 2);
  assert.equal(act('ask', { thing: node.start, attr: 'shape' }).result.value, 'oval');
  assert.equal(act('ask', { thing: node[1], attr: 'shape' }).result.value, 'rectangle');
});

// Block 07:30 item 1 (PSys2 Q17): "a tree of the parts of a car" had no fill; k.parts.whole has its WordNet parts.
test('a tree and a mind map of the parts of a car are filled by k.parts.whole', () => {
  for (const kind of ['tree', 'mind map']) {
    const fill = fills.find((f) => one(f, 'kind') === kind && one(f, 'type') === 'k.parts.whole');
    assert.ok(fill, kind);
    assert.deepEqual([one(fill, 'key'), one(fill, 'gives'), one(fill, 'topic')], ['has', 'edges', 'name']);
    const car = factsOf('k.parts', 'k.parts.whole', worlds).find((f) => one(f, one(fill, 'topic')) === 'car');
    const parts = all(car, one(fill, 'key'));
    assert.ok(parts.length >= 20 && parts.includes('car door') && parts.includes('bumper'), parts.join(', '));
  }
});

// Block 07:30 item 2 (PSys2 Q17): the planets by distance and by size as timelines; everyday procedures as flowcharts.
test('a timeline of the planets by distance (and by size): k.space.body order and size_rank, the fill saying its attribute', () => {
  const attributes = new Set(factsOf('k.attributes', 'k.attributes.attribute', worlds).map((f) => one(f, 'name')));
  for (const f of fills.filter((x) => x.attrs.by)) assert.ok(attributes.has(one(f, 'by')), `${f.id}: by ${one(f, 'by')}`);
  const bodies = factsOf('k.space', 'k.space.body', worlds);
  const line = (by) => {
    const fill = fills.find((f) => one(f, 'kind') === 'timeline' && one(f, 'by') === by);
    return bodies.filter((b) => one(b, one(fill, 'topic')) === 'planet' && b.attrs[one(fill, 'key')]).sort((a, b) => one(a, one(fill, 'key')) - one(b, one(fill, 'key'))).map((b) => one(b, 'name'));
  };
  assert.deepEqual(line('distance'), ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune']);
  assert.deepEqual(line('size'), ['Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Earth', 'Venus', 'Mars', 'Mercury']);
});

test('a flowchart of making tea, washing hands, planting a seed: everyday procedures, each cited or marked own, apart from the planner\'s methods', () => {
  const howtos = factsOf('k.procedures', 'k.procedures.howto', worlds), steps = factsOf('k.procedures', 'k.procedures.howto_step', worlds);
  const methods = new Set(factsOf('k.procedures', 'k.procedures.method', worlds).map((m) => one(m, 'name')));
  assert.deepEqual(howtos.map((h) => one(h, 'name')).sort(), ['making tea', 'planting a seed', 'washing hands']);
  for (const h of howtos) {
    assert.ok(!methods.has(one(h, 'name')), `${one(h, 'name')} is not a method of the planner`);
    assert.equal(Boolean(h.attrs.cite), one(h, 'basis') === 'cited', `${one(h, 'name')}: cited with a cite, own without`);
    const own = steps.filter((s) => one(s, 'howto') === one(h, 'name'));
    const ns = new Set(own.map((s) => one(s, 'n')));
    assert.equal(own.filter((s) => !s.attrs.after).length, 1, `${one(h, 'name')}: one first step`);
    for (const s of own) {
      for (const a of all(s, 'after')) assert.ok(ns.has(a) && Number(a) < Number(one(s, 'n')), `${s.id} after ${a}`);
      // a branch names the answer of a decision it comes after; a decision has a yes and a no
      if (s.attrs.branch) assert.ok(all(s, 'after').some((a) => one(own.find((x) => one(x, 'n') === a), 'role') === 'decision'), s.id);
      if (one(s, 'role') === 'decision') assert.deepEqual(own.filter((x) => all(x, 'after').includes(one(s, 'n'))).map((x) => one(x, 'branch')).sort(), ['no', 'yes'], s.id);
    }
  }
  // the flowchart of making tea, by the fill: its steps in order, a diamond for the question
  const fill = fills.find((f) => one(f, 'kind') === 'flowchart' && one(f, 'type') === 'k.procedures.howto_step' && one(f, 'key') === 'after');
  const tea = steps.filter((s) => one(s, one(fill, 'topic')) === 'making tea').sort((a, b) => one(a, 'n') - one(b, 'n'));
  assert.equal(one(tea[0], 'about'), 'Boil water');
  assert.equal(shapeOf('flowchart', one(tea.find((s) => one(s, 'role') === 'decision'), 'role')), 'diamond');
  assert.equal(one(howtos.find((h) => one(h, 'name') === 'washing hands'), 'basis'), 'cited');
});

// Block 07:30 item 9 (PSys2 Q17: the speller read "tea" as "sea"): the topics of the diagram knowledge, derived.
test('the topic shards are what tools/diagram-topics.mjs gives; every topic word of the fills is there ("making tea", car, planet)', async () => {
  const { topicShards } = await import('../tools/diagram-topics.mjs');
  const files = topicShards();
  const dir = join(WORLDS_DIR, 'k.diagrams', 'shards');
  assert.deepEqual((await import('node:fs')).readdirSync(dir).filter((f) => f.startsWith('topics-')).sort(), Object.keys(files).sort());
  for (const [n, t] of Object.entries(files)) assert.equal(readFileSync(join(dir, n), 'utf8'), t, n);
  const topics = factsOf('k.diagrams', 'k.diagrams.topic', worlds);
  const names = new Set(topics.map((t) => one(t, 'name')));
  for (const n of ['making tea', 'washing hands', 'car', 'planet', 'frog life cycle', 'set a table']) assert.ok(names.has(n), n);
  const kindNames = new Set(kinds.map((k) => one(k, 'name')));
  for (const t of topics) { assert.ok(Number(one(t, 'nodes')) >= 2, t.id); for (const k of all(t, 'kind')) assert.ok(kindNames.has(k), `${t.id}: ${k}`); }
  assert.ok(all(topics.find((t) => one(t, 'name') === 'car' && all(t, 'from').includes('k.parts.whole')), 'kind').includes('tree'));
});
