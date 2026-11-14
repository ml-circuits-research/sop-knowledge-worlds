// Selectional restrictions (block "21:05" item 1): k.kinds.argument (the classes of arguments of the roles of
// k.actions and of the objects of relations) and k.kinds.relation (every key of every knowledge type read as a
// relation with typed arguments), written by tools/relations-core.mjs. The relations that questions use (the
// knowledge question frames of the first host, and the keys the readings of its 292 real questions reach) must
// each have a typed subject and object.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR, scanWorlds, fullWorld } from '../tools/lib/worlds.mjs';
import { relationShards, relationRows, readTypes, ARGUMENTS } from '../tools/relations-core.mjs';
import { SENSES } from '../tools/joins.mjs';
import { run as askReal } from '../tools/ask-real.mjs';
import { parse } from '../tools/sopworld/sopworld.mjs';

const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const worlds = scanWorlds();
const dir = join(WORLDS_DIR, 'k.kinds', 'shards');
const facts = readdirSync(dir).filter((f) => /^(arguments|relations-).*\.sop$/.test(f)).flatMap((f) => parse(readFileSync(join(dir, f), 'utf8')));
const one = (w, k) => tok(w.attrs[k]?.[0]);
const all = (w, k) => (w.attrs[k] ?? []).map(tok);
const args = new Map(facts.filter((w) => w.type === 'k.kinds.argument').map((w) => [one(w, 'name'), w]));
const relations = new Map(facts.filter((w) => w.type === 'k.kinds.relation').map((w) => [`${one(w, 'type')}.${one(w, 'key')}`, w]));
const declared = new Set(worlds.flatMap((w) => [...w.schemaText.matchAll(/core\.type of=(\S+)/g)].map((m) => m[1])));
// A class whose things are named by a type: a relation with that object names its types.
const NAMED_CLASSES = new Set(['thing', 'place', 'act', 'time', 'person', 'group']);

test('the shards are what tools/relations-core.mjs gives, and they load with k.kinds', () => {
  const files = relationShards(relationRows(worlds));
  assert.deepEqual(readdirSync(dir).filter((f) => /^(arguments|relations-).*\.sop$/.test(f)).sort(), Object.keys(files).sort());
  for (const [name, t] of Object.entries(files)) assert.equal(readFileSync(join(dir, name), 'utf8'), t, `${name}: run node tools/relations-core.mjs`);
  const w = fullWorld('k.kinds', worlds);
  assert.equal(w.ofType('k.kinds.argument').length, ARGUMENTS.length);
  assert.equal(w.ofType('k.kinds.relation').length, relations.size);
});

test('every role of every act of k.actions takes a class of arguments, and every class names declared types and known senses', () => {
  const roles = worlds.find((w) => w.id === 'k.actions').shards.flatMap((s) => parse(s.text)).filter((w) => w.type === 'k.actions.role');
  assert.ok(roles.length >= 57);
  for (const r of roles) assert.ok(args.has(one(r, 'holds')), `${one(r, 'act')}.${one(r, 'name')} holds ${one(r, 'holds')}`);
  // and the enum of `holds` is a subset of the classes: a new value of it needs a class first
  const holds = worlds.find((w) => w.id === 'k.actions').schemaText.match(/key=holds [^\n]*/)[0].match(/enum=(\S+)/g).map((e) => e.slice(5));
  assert.deepEqual(holds.filter((h) => !args.has(h)), []);
  for (const [name, g] of args) {
    for (const t of all(g, 'type')) assert.ok(declared.has(t), `${name}: type ${t}`);
    for (const s of all(g, 'sense')) assert.ok(SENSES.includes(s), `${name}: sense ${s}`);
    assert.ok(all(g, 'example').length, name);
  }
});

test('every key of every knowledge type is a relation with a subject and an object of a known class; object types are declared', () => {
  const types = readTypes(worlds);
  let n = 0;
  for (const [t, x] of types) for (const s of x.slots) if (s.key !== x.naming) {
    n++;
    const r = relations.get(`${t}.${s.key}`);
    assert.ok(r, `${t}.${s.key}`);
    assert.ok(one(r, 'subject'), `${t}.${s.key}: subject`);
    if (x.sense) assert.equal(one(r, 'subject_sense'), x.sense, `${t}.${s.key}`);
    assert.ok(args.has(one(r, 'object')), `${t}.${s.key}: object ${one(r, 'object')}`);
    for (const o of all(r, 'object_type')) assert.ok(declared.has(o), `${t}.${s.key}: ${o}`);
    for (const o of all(r, 'object_sense')) assert.ok(SENSES.includes(o), `${t}.${s.key}: ${o}`);
  }
  assert.equal(relations.size, n);
  const byClass = {};
  for (const r of relations.values()) byClass[one(r, 'object')] = (byClass[one(r, 'object')] ?? 0) + 1;
  console.log(`relations: ${relations.size}; by object class: ${JSON.stringify(byClass)}`);
});

// The relations of the first host's question frames (its Talk tab and its knowledge frames: "what sound does a cow
// make", "what is the capital of Peru", "how many legs does a spider have", "what colour is a banana", "what is a
// cake made of", "where does a camel live", "can a penguin fly", "what is a baby cat called", "what is a dog
// covered in", "what is a hammer for", "what are the parts of a tent", "what is next to France", "which is bigger",
// "what comes after May", "what do red and blue make", "how many sides has a square", "what kind of animal is a
// frog", "what is a kitten a kind of"), with what each must take: [type.key, subject sense or word, object class,
// an object type it must name (or null)].
const FRAMES = [
  ['k.animals.animal.sound', 'animal', 'word', 'k.words.sense'],
  ['k.geo.country.capital', 'place', 'place', 'k.geo.city'],
  ['k.geo.city.capital_of', 'place', 'place', 'k.geo.country'],
  ['k.animals.animal.legs', 'animal', 'number', null],
  ['k.attributes.thing.colour', 'thing', 'value', 'k.colours.colour'],
  ['k.commonsense.thing.made_of', 'thing', 'thing', 'k.objects.object'],
  ['k.food.food.made_of', 'food', 'thing', 'k.objects.object'],
  ['k.animals.animal.habitat', 'animal', 'place', null],
  ['k.commonsense.thing.at', 'thing', 'place', null],
  ['k.scenes.thing.place', 'thing', 'place', null],
  ['k.animals.animal.can', 'animal', 'act', 'k.actions.action'],
  ['k.animals.animal.cannot', 'animal', 'act', 'k.actions.action'],
  ['k.commonsense.thing.can', 'thing', 'act', 'k.actions.action'],
  ['k.animals.animal.baby', 'animal', 'word', null],
  ['k.animals.animal.covering', 'animal', 'value', null],
  ['k.animals.animal.eats', 'animal', 'thing', null],
  ['k.commonsense.thing.used_for', 'thing', 'word', null],
  ['k.parts.usual.has', 'word', 'word', null],
  ['k.geo.country.neighbour', 'place', 'place', 'k.geo.country'],
  ['k.geo.country.continent', 'place', 'place', 'k.geo.continent'],
  ['k.scenes.thing.size', 'thing', 'value', null],
  ['k.time.month.next', 'time', 'time', 'k.time.month'],
  ['k.colours.mix.gives', 'mix', 'value', 'k.colours.colour'],
  ['k.shapes.shape.sides', 'shape', 'number', null],
  ['k.animals.animal.class', 'animal', 'kind', 'k.animals.class'],
  ['k.words.sense.kind_of', 'word', 'kind', 'k.words.sense'],
  ['k.body.part.part_of', 'body part', 'thing', 'k.body.part'],
  ['k.wearables.wearable.worn_on', 'clothing', 'thing', 'k.wearables.place'],
];

test('every relation of the question frames has typed arguments: the subject\'s kind and the object\'s class and types', () => {
  for (const [rel, subject, object, objectType] of FRAMES) {
    const r = relations.get(rel);
    assert.ok(r, rel);
    assert.ok([one(r, 'subject'), one(r, 'subject_sense')].includes(subject), `${rel}: subject ${one(r, 'subject')} / ${one(r, 'subject_sense')}`);
    assert.equal(one(r, 'object'), object, rel);
    if (objectType) assert.ok(all(r, 'object_type').includes(objectType), `${rel}: ${all(r, 'object_type')}`);
  }
  // the scale of size, for "bigger"
  assert.equal(one(relations.get('k.scenes.thing.size'), 'scale'), 'size');
});

test('every relation the readings of the 292 real questions reach (tools/ask-real.mjs) has typed arguments', () => {
  const { rows } = askReal();
  const keys = new Set(), untyped = [];
  for (const r of rows) for (const k of String(r.reading?.key ?? '').split(' ').filter(Boolean)) {
    if (k.endsWith('.*')) { const t = k.slice(0, -2); for (const rel of relations.keys()) if (rel.startsWith(`${t}.`)) keys.add(rel); continue; }
    keys.add(k);
  }
  const missing = [...keys].filter((k) => !relations.has(k));
  for (const k of keys) {
    const r = relations.get(k);
    if (r && NAMED_CLASSES.has(one(r, 'object')) && !all(r, 'object_type').length) untyped.push(k);
  }
  console.log(`keys reached by the readings: ${keys.size}; without a relation: ${missing.length}; of a named class without an object type: ${untyped.join(', ') || 'none'}`);
  // the naming keys and the definitions (a gloss) are read as what the thing is, not as a relation
  assert.deepEqual(missing.filter((k) => !/\.(name|word|text)$/.test(k)), []);
  assert.ok(keys.size >= 30, `${keys.size}`);
});
