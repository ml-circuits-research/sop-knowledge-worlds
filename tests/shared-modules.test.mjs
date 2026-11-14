// Q34 (a): shared modules made here. Item 1: k.drawing (part, point) extended by k.objects and k.faces. Item 4: the
// basic colours declared once in k.values (k.values.coloured) and every other list of them kept equal. Item 6: one
// kind-of relation followed upwards by one rule (k.kinds), extended by k.commonsense, k.people and k.shapes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse } from '../tools/sopworld/sopworld.mjs';
import { scanWorlds, schemaWorld, fullWorld } from '../tools/lib/worlds.mjs';

const worlds = scanWorlds();
const tok = (t) => (t?.startsWith("\"") ? JSON.parse(t) : t);
const schema = (id) => parse(worlds.find((w) => w.id === id).schemaText);
const slots = (id, type) => schema(id).filter((w) => w.type === 'core.slot' && w.attrs.of[0] === type);
const typeWire = (id, type) => schema(id).find((w) => w.type === 'core.type' && w.attrs.of[0] === type);

test('Q34 item 1: k.objects and k.faces draw with the parts and points of k.drawing, declared once', () => {
  const shared = slots('k.drawing', 'k.drawing.part').map((s) => s.attrs.key[0]);
  assert.deepEqual(shared, ['shape', 'x', 'y', 'w', 'h', 'z', 'colour', 'rgb', 'pointing', 'opens']);
  for (const [id, part, point] of [['k.objects', 'k.objects.part', 'k.objects.point'], ['k.faces', 'k.faces.part', 'k.faces.point']]) {
    assert.equal(typeWire(id, part).attrs.extends[0], 'k.drawing.part', part);
    assert.equal(typeWire(id, point).attrs.extends[0], 'k.drawing.point', point);
    for (const s of [...slots(id, part), ...slots(id, point)]) assert.ok(!shared.includes(s.attrs.key[0]) || s.attrs.of[0].endsWith('.point'), `${s.id} says again a slot of k.drawing`);
    const { world } = schemaWorld(worlds, id);
    const keys = Object.keys(world.schema(part).keys);
    for (const k of shared) assert.ok(keys.includes(k), `${part} has ${k} through k.drawing`);
    // block 06:55 item 2: k.objects.part also takes the slot group k.named (named=model on its imported part names)
    assert.deepEqual(world.schema(part).lineage, id === 'k.objects' ? [part, 'k.drawing.part', 'k.named.labelled'] : [part, 'k.drawing.part']);
    assert.equal(world.fork().tell(`@t.p ${part} ${id === 'k.faces' ? 'slot=s ' : ''}of=a name=b shape=blob x=1 y=1 w=1 h=1 z=1 colour=red core.source="t"`).ok, false, 'the shape enum of k.drawing is checked');
  }
});

test('Q34 item 4: the basic colours are declared once in k.values; every other list of them is the same list', () => {
  const enumOf = (id, type, key) => slots(id, type).find((s) => s.attrs.key[0] === key).attrs.enum;
  const basic = enumOf('k.values', 'k.values.coloured', 'colour');
  assert.equal(basic.length, 11);
  for (const [id, type] of [['k.food', 'k.food.food'], ['k.space', 'k.space.body']]) {
    assert.equal(typeWire(id, type).attrs.extends[0], 'k.values.coloured', type);
    assert.equal(slots(id, type).some((s) => s.attrs.key[0] === 'colour'), false, `${type} takes colour from k.values`);
    assert.equal(schemaWorld(worlds, id).world.fork().tell(`@t.f ${type} name=x colour=teal core.source="t"`).ok, false, `${type}: a colour outside the list is refused`);
  }
  for (const [id, type, key, extra] of [['k.drawing', 'k.drawing.part', 'colour', []], ['k.values', 'k.values.colour', 'basic', []], ['k.attributes', 'k.attributes.drawn', 'drawn_colour', []],
    ['k.colours', 'k.colours.colour', 'family', []], ['k.attributes', 'k.attributes.thing', 'colour', ['any']]]) assert.deepEqual([...enumOf(id, type, key)].sort(), [...basic, ...extra].sort(), `${type}.${key}`);
});

test('Q34 item 6 and Q33: one kind-of relation, followed upwards by one rule; a shape may be a kind of several', () => {
  for (const [id, type] of [['k.commonsense', 'k.commonsense.thing'], ['k.people', 'k.people.kind'], ['k.shapes', 'k.shapes.shape']]) {
    assert.equal(typeWire(id, type).attrs.extends[0], 'k.kinds.kind', type);
    assert.equal(slots(id, type).some((s) => s.attrs.key[0] === 'is_a'), false, `${type} takes is_a from k.kinds`);
  }
  const kindsOf = (w, name) => [...new Set(w.ofType('k.kinds.kind').filter((x) => [name, JSON.stringify(name)].includes(x.attrs.name?.[0])).flatMap((x) => x.attrs.kind_of ?? []))].sort();
  const shapes = fullWorld('k.shapes', worlds);
  assert.deepEqual(kindsOf(shapes, 'square'), ['polygon', 'quadrilateral', 'rectangle', 'rhombus']);
  assert.ok(kindsOf(shapes, 'triangle').includes('polygon'));
  const people = fullWorld('k.people', worlds);
  assert.deepEqual(kindsOf(people, 'boy'), ['child', 'person']);
  // the kind grandfather is a man; the role grandfather a relative (block 07:40 item 4): one name, kinds from both
  assert.deepEqual(kindsOf(people, 'grandfather'), ['man', 'person', 'relative']);
  const common = fullWorld('k.commonsense', worlds);
  assert.ok(kindsOf(common, 'milk').includes('liquid'), 'a drink of k.food is a liquid (the rule of k.commonsense), so a kind of liquid (the rule of k.kinds)');
});

test('block 06:55 item 2: every drawing= of every world names a k.objects object (the joins hold when the objects are told first)', () => {
  // Not declared as `type=k.objects.object by=name` (questions.md Q48): sopworld checks such a join when a fact is
  // told, once the type is declared, so a fact told before its object is refused; k.objects imports k.commonsense,
  // which imports k.animals and k.food, whose facts join to k.objects.
  const objects = new Set(worlds.find((w) => w.id === 'k.objects').shards.flatMap((s) => [...s.text.matchAll(/ k\.objects\.object name=("[^"]*"|\S+)/g)].map((m) => tok(m[1]))));
  const bad = [];
  let n = 0;
  for (const w of worlds.filter((x) => x.id !== 'k.objects')) for (const s of w.shards) for (const x of parse(s.text)) for (const v of (x.attrs.drawing ?? []).map(tok)) {
    if (x.type === 'core.word' || !x.type.startsWith('k.')) continue;
    n++;
    if (!objects.has(v)) bad.push(`${x.id}: ${v}`);
  }
  assert.ok(n > 1000, `${n} joins`);
  assert.deepEqual(bad, []);
});

test('block 06:55 item 2: one slot named in the slot group k.named; excludes on every approximate key with an exact twin; no ambiguous key', () => {
  const all = worlds.flatMap((w) => parse(w.schemaText).map((x) => ({ ...x, world: w.id })));
  const own = all.filter((x) => x.type === 'core.slot' && x.attrs.key[0] === 'named').map((x) => x.attrs.of[0]);
  assert.deepEqual(own.sort(), ['k.named.labelled', 'k.parts.usual'], 'only k.named and k.parts.usual (required there) declare named');
  const takers = all.filter((x) => x.type === 'core.type' && (x.attrs.extends ?? []).includes('k.named.labelled'));
  assert.equal(takers.length, 21);
  for (const t of takers) {
    const { world } = schemaWorld(worlds, t.world);
    assert.ok(world.schema(t.attrs.of[0]).keys.named, `${t.attrs.of[0]} has named`);
    assert.ok((parse(worlds.find((w) => w.id === t.world).schemaText).find((x) => x.type === 'core.module').attrs.imports ?? []).includes('k.named'), `${t.world} imports k.named`);
  }
  // an _about key and its exact twin on one type exclude each other
  const slotsOf = new Map();
  for (const x of all.filter((y) => y.type === 'core.slot')) (slotsOf.get(x.attrs.of[0]) ?? slotsOf.set(x.attrs.of[0], new Map()).get(x.attrs.of[0])).set(x.attrs.key[0], x);
  let pairs = 0;
  for (const [type, keys] of slotsOf) for (const [k, x] of keys) if (k.endsWith('_about') && keys.has(k.slice(0, -6))) { pairs++; assert.deepEqual(x.attrs.excludes, [k.slice(0, -6)], `${type}.${k}`); }
  assert.equal(pairs, 5);
  const { world } = schemaWorld(worlds, 'k.values');
  const r = world.fork().tell('@t.c k.values.colour name=t rgb=1 rgb_about=1 core.source="t"');
  assert.equal(r.ok, false);
  assert.ok(r.violations.some((v) => v.kind === 'excludes'), JSON.stringify(r.violations));
  assert.equal(all.filter((x) => x.type === 'core.deny' && /\.both$/.test(x.id) && !['k.animals', 'k.units'].includes(x.world)).length, 0, 'the denies that excludes replaces are gone');
});
