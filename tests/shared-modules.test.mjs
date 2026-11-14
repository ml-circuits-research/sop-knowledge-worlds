// Q34 (a): shared modules made here. Item 1: k.drawing (part, point) extended by k.objects and k.faces. Item 4: the
// basic colours declared once in k.values (k.values.coloured) and every other list of them kept equal. Item 6: one
// kind-of relation followed upwards by one rule (k.kinds), extended by k.commonsense, k.people and k.shapes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse } from '../tools/sopworld/sopworld.mjs';
import { scanWorlds, schemaWorld, fullWorld } from '../tools/lib/worlds.mjs';

const worlds = scanWorlds();
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
    assert.deepEqual(world.schema(part).lineage, [part, 'k.drawing.part']);
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
