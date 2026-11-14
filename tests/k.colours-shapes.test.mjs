// k.colours and k.shapes (R7.3): colour families, light and dark, mixes, typical things; shapes with sides and
// corners, round or not, and things of that shape.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR, scanWorlds, fullWorld, factsOf } from '../tools/lib/worlds.mjs';
import { handSources } from '../tools/lib/worlds.mjs';
import { colourShards, shapeShards, COLOURS, SHAPES } from '../tools/colours-shapes-core.mjs';

const worlds = scanWorlds();
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const one = (w, k) => tok(w.attrs[k]?.[0]);
const coloursWorld = fullWorld('k.colours', worlds), shapesWorld = fullWorld('k.shapes', worlds);
const colours = coloursWorld.ofType('k.colours.colour'), mixes = coloursWorld.ofType('k.colours.mix'), shapes = shapesWorld.ofType('k.shapes.shape');
const drawn = new Set(factsOf('k.objects', ['k.objects.object', 'k.objects.stand_in'], worlds).map((w) => one(w, 'name')));
const TONE = { light: 0, medium: 1, dark: 2 };

test('the shards are what tools/colours-shapes-core.mjs gives', () => {
  for (const [name, text] of Object.entries(colourShards())) assert.equal(readFileSync(join(WORLDS_DIR, 'k.colours', 'shards', name), 'utf8'), text, name);
  for (const [name, text] of Object.entries(shapeShards())) assert.equal(readFileSync(join(WORLDS_DIR, 'k.shapes', 'shards', name), 'utf8'), text, name);
  assert.equal(colours.length, COLOURS.length);
  // Two more shapes come from the PSys2 tab worlds (shard psys2: rhombus, quadrilateral).
  assert.equal(shapes.filter((w) => !['rhombus', 'quadrilateral'].includes(one(w, 'name'))).length, SHAPES.length);
  assert.ok(colours.length >= 30 && shapes.length >= 30);
});

test('colours: every family is a colour of its own family; lighter and darker agree with the tone and with each other', () => {
  const by = new Map(colours.map((w) => [one(w, 'name'), w]));
  for (const w of colours) {
    const name = one(w, 'name'), family = by.get(one(w, 'family'));
    assert.ok(family && one(family, 'family') === one(family, 'name'), `${w.id}: family`);
    assert.ok(w.attrs.thing?.length >= 1, `${w.id}: a typical thing`);
    for (const [k, sign] of [['lighter', -1], ['darker', 1]]) for (const v of w.attrs[k] ?? []) {
      const other = by.get(tok(v));
      assert.ok(other && tok(v) !== name, `${w.id}: ${k} ${v}`);
      assert.ok((TONE[one(other, 'tone')] - TONE[one(w, 'tone')]) * sign >= 0, `${w.id}: ${v} is not ${k}`);
    }
    for (const v of w.attrs.complement ?? []) assert.equal(one(by.get(tok(v)), 'complement'), name, `${w.id}: complement from both sides`);
    assert.ok(handSources(w.attrs['core.source']), w.id);
  }
  for (const [a, b] of [['red', 'green'], ['blue', 'orange'], ['yellow', 'purple']]) assert.equal(one(by.get(a), 'complement'), b);
  // The basic colours: every family name of the schema is there.
  for (const f of ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'brown', 'black', 'white', 'grey']) assert.ok(by.has(f), f);
});

test('mixes: three colours of this world, each pair once in the order of the alphabet; the school mixes are there', () => {
  const names = new Set(colours.map((w) => one(w, 'name')));
  const gives = new Map();
  for (const m of mixes) {
    for (const k of ['a', 'b', 'gives']) assert.ok(names.has(one(m, k)), `${m.id}: ${k}`);
    assert.ok(one(m, 'a') < one(m, 'b'), m.id);
    gives.set(`${one(m, 'a')}+${one(m, 'b')}`, one(m, 'gives'));
  }
  assert.equal(gives.size, mixes.length);
  assert.deepEqual([gives.get('red+yellow'), gives.get('blue+yellow'), gives.get('blue+red'), gives.get('red+white'), gives.get('black+white')], ['orange', 'green', 'purple', 'pink', 'grey']);
  const w = coloursWorld.fork();
  assert.equal(w.tell('@a1 k.colours.colour name=teal family=sea tone=medium temperature=cool', { ns: 'app' }).ok, false);
});

test('shapes: flat shapes have sides, solids have faces and edges; what a shape refers to is a shape; counts of well-known shapes', () => {
  const by = new Map(shapes.map((w) => [one(w, 'name'), w]));
  for (const w of shapes) {
    const kind = one(w, 'kind');
    if (kind === 'solid') { assert.ok(w.attrs.faces && w.attrs.edges && w.attrs.corners && !w.attrs.sides, w.id); assert.equal(one(by.get(one(w, 'flat')), 'kind'), 'flat', `${w.id}: flat`); }
    else assert.ok(!w.attrs.faces && !w.attrs.edges && !w.attrs.face && !w.attrs.flat, w.id);
    if (kind === 'line') assert.ok(!w.attrs.sides && !w.attrs.corners, w.id);
    for (const k of ['face', 'is_a']) for (const v of w.attrs[k] ?? []) assert.ok(by.has(tok(v)) && tok(v) !== one(w, 'name'), `${w.id}: ${k} ${v}`);
    for (const v of w.attrs.face ?? []) assert.equal(one(by.get(tok(v)), 'kind'), 'flat', `${w.id}: face ${v}`);
    // A flat shape with straight sides only has as many corners as sides.
    if (kind === 'flat' && one(w, 'round') === 'false' && w.attrs.sides) assert.equal(one(w, 'sides'), one(w, 'corners'), w.id);
    assert.ok(handSources(w.attrs['core.source']), w.id);
  }
  const n = (name, k) => Number(one(by.get(name), k));
  assert.deepEqual(['triangle', 'square', 'pentagon', 'hexagon', 'octagon'].map((s) => n(s, 'sides')), [3, 4, 5, 6, 8]);
  assert.deepEqual([n('cube', 'faces'), n('cube', 'edges'), n('cube', 'corners')], [6, 12, 8]);
  // Euler: corners - edges + faces = 2 for the solids with flat faces only.
  for (const s of ['cube', 'cuboid', 'pyramid', 'prism']) assert.equal(n(s, 'corners') - n(s, 'edges') + n(s, 'faces'), 2, s);
  const w = shapesWorld.fork();
  assert.equal(w.tell('@a1 k.shapes.shape name=blob kind=solid sides=3 round=true', { ns: 'app' }).ok, false);
  assert.equal(w.tell('@a2 k.shapes.shape name=blob kind=flat faces=3 round=true', { ns: 'app' }).ok, false);
});

test('joins: most typical things have a drawing; every shape of a k.objects part is a shape here', () => {
  for (const [list, min] of [[colours, 0.9], [shapes, 0.9]]) {
    const things = list.flatMap((w) => (w.attrs.thing ?? []).map(tok));
    const have = things.filter((t) => drawn.has(t));
    assert.ok(have.length >= things.length * min, `${have.length} of ${things.length} things have a drawing`);
  }
  const names = new Set(shapes.map((w) => one(w, 'name')));
  const schema = worlds.find((w) => w.id === 'k.drawing').schemaText; // the parts of k.objects take their shape from k.drawing (Q34 item 1)
  const line = schema.split('\n').find((l) => l.startsWith('@k.drawing.part.shape '));
  const partShapes = [...line.matchAll(/ enum=(\S+)/g)].map((m) => m[1]);
  assert.ok(partShapes.length >= 6);
  for (const s of partShapes) assert.ok(names.has(s), `the part shape ${s} is not a k.shapes shape`);
});

test('joins to k.values: every colour here has its value there (by name or by a word); most shapes have their name there', () => {
  const values = fullWorld('k.values', worlds);
  const reach = (type, of) => {
    const names = new Set(values.ofType(type).map((w) => one(w, 'name')));
    for (const w of values.ofType('core.word')) if (w.attrs.of?.[0] === of) for (const t of w.attrs.text ?? []) names.add(tok(t));
    return names;
  };
  const valueColours = reach('k.values.colour', 'k.values.colour.name'), valueShapes = reach('k.values.shape', 'k.values.shape.name');
  for (const w of colours) assert.ok(valueColours.has(one(w, 'name')), `${one(w, 'name')} has no value in k.values`);
  const without = shapes.map((w) => one(w, 'name')).filter((n) => !valueShapes.has(n));
  assert.ok(without.length <= 8, `shapes that k.values does not name: ${without.join(', ')}`);
});

test('other names reach the colour and the shape through the vocabulary index', () => {
  const vocab = JSON.parse(readFileSync(join(WORLDS_DIR, 'vocab.json'), 'utf8'));
  for (const word of ['gray', 'burgundy', 'sky blue', 'teal', 'golden']) assert.ok(vocab[word]?.includes('k.colours/shards/colours'), word);
  for (const word of ['ellipse', 'rhombus', 'oblong', 'globe', 'tube', 'teardrop']) assert.ok(vocab[word]?.includes('k.shapes/shards/shapes'), word);
});
