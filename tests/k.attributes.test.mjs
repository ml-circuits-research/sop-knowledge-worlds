// k.attributes (Round 8, item 2): attributes, where their values are found, kinds, usual values of common things.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, WORLDS_DIR, scanWorlds, fullWorld, schemaWorld } from '../tools/lib/worlds.mjs';
import { attributeShards, readThings, ATTRIBUTES } from '../tools/attributes-core.mjs';

const worlds = scanWorlds();
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const one = (w, k) => tok(w.attrs[k]?.[0]);
const world = fullWorld('k.attributes', worlds);
const things = world.ofType('k.attributes.thing');

test('the shards are what tools/attributes-core.mjs gives; every thing is model-labelled and says something', () => {
  for (const [name, text] of Object.entries(attributeShards())) assert.equal(readFileSync(join(WORLDS_DIR, 'k.attributes', 'shards', name), 'utf8'), text, name);
  assert.equal(things.length, readThings().length);
  assert.ok(things.length >= 750);
  const kinds = new Set(world.ofType('k.attributes.kind').map((k) => one(k, 'name')));
  for (const t of things) {
    assert.equal(one(t, 'named'), 'model', t.id);
    assert.deepEqual(t.attrs['core.source'], ['"hand-core 1"'], t.id);
    assert.ok(['kind', 'colour', 'material', 'wheels', 'can', 'used_for'].some((k) => t.attrs[k]), t.id);
    if (t.attrs.kind) assert.ok(kinds.has(one(t, 'kind')), `${t.id}: kind ${one(t, 'kind')}`);
  }
  assert.ok(things.filter((t) => t.attrs.colour).length >= 250);
});

test('every place where an attribute is found exists: the world, the type and the key; kinds name attributes', () => {
  const names = new Set(world.ofType('k.attributes.attribute').map((a) => one(a, 'name')));
  assert.equal(names.size, ATTRIBUTES.length);
  const found = world.ofType('k.attributes.found');
  for (const f of found) {
    assert.ok(names.has(one(f, 'attribute')), f.id);
    const { world: w, result } = schemaWorld(worlds, one(f, 'world'));
    assert.ok(result.ok, f.id);
    assert.ok(w.schema(one(f, 'type'))?.keys[one(f, 'key')], `${f.id}: ${one(f, 'type')} has no key ${one(f, 'key')}`);
  }
  for (const n of names) assert.ok(found.some((f) => one(f, 'attribute') === n), `${n} is found nowhere`);
  for (const k of world.ofType('k.attributes.kind')) for (const a of k.attrs.attribute) assert.ok(names.has(tok(a)), `${k.id}: ${a}`);
});

test('the facts asked for; the audit names rows of the table', () => {
  const by = new Map(things.map((t) => [one(t, 'name'), t]));
  assert.deepEqual(by.get('grass').attrs.colour, ['green']);
  assert.deepEqual(by.get('car').attrs.wheels, ['4']);
  assert.deepEqual(by.get('bicycle').attrs.wheels, ['2']);
  assert.ok(by.get('plane').attrs.can.includes('fly'));
  assert.deepEqual(by.get('car').attrs.colour, ['any'], 'a car has no usual colour: it comes in any');
  const audit = readFileSync(join(REPO, 'sources/hand-core/attributes-audit.tsv'), 'utf8').split('\n').filter(Boolean).slice(1).map((l) => l.split('\t'));
  assert.equal(audit.length, 90);
  assert.equal(audit.filter((r) => r[1] === 'wrong').length, 0);
  for (const [name, verdict] of audit) assert.ok(by.has(name) || verdict === 'unclear', name);
});

test('things reach their shard through the vocabulary index', () => {
  const vocab = JSON.parse(readFileSync(join(WORLDS_DIR, 'vocab.json'), 'utf8'));
  for (const [word, shard] of [['frog', 'things-living'], ['grass', 'things-nature'], ['car', 'things-big'], ['scarf', 'things-worn'], ['hammer', 'things-objects']]) assert.ok(vocab[word]?.includes(`k.attributes/shards/${shard}`), word);
});

// Aspects (reviewer, 2026-11-13 21:30).
import { existsSync as exists } from 'node:fs';
import { ASPECTS, FAMILIES, SHOWS } from '../tools/attributes-core.mjs';

test('aspects: every attribute belongs to one; every family and every row names a world, type and keys that exist', () => {
  const aspects = new Set(world.ofType('k.attributes.aspect').map((a) => one(a, 'name')));
  assert.deepEqual([...aspects].sort(), ['geographic', 'numeric', 'relational', 'social', 'spatial', 'temporal', 'textual', 'visual']);
  for (const a of world.ofType('k.attributes.attribute')) assert.ok(aspects.has(one(a, 'aspect')), a.id);
  const families = new Set(world.ofType('k.attributes.family').map((f) => one(f, 'name')));
  assert.equal(families.size, FAMILIES.length);
  const schemaOf = new Map();
  const keysOf = (w, type) => { if (!schemaOf.has(w)) schemaOf.set(w, schemaWorld(worlds, w).world); return schemaOf.get(w).schema(type)?.keys; };
  for (const f of world.ofType('k.attributes.family')) if (f.attrs.type) assert.ok(keysOf(one(f, 'world'), one(f, 'type'))?.[one(f, 'by')], f.id);
  const rows = world.ofType('k.attributes.shows');
  assert.equal(rows.length, SHOWS.reduce((n, r) => n + r.keys.length, 0));
  for (const r of rows) {
    assert.ok(families.has(one(r, 'family')) && aspects.has(one(r, 'aspect')), r.id);
    const keys = keysOf(one(r, 'world'), one(r, 'type'));
    assert.ok(keys?.[one(r, 'key')] && keys?.[one(r, 'by')], `${r.id}: ${one(r, 'type')} has no key ${one(r, 'key')} or ${one(r, 'by')}`);
  }
  for (const f of families) assert.ok(rows.some((r) => one(r, 'family') === f), `${f} shows no aspect`);
  assert.equal(ASPECTS.length, 8);
});

test('ASPECTS.md has a row for every family and a column for every aspect (the counts change when other worlds grow: rerun tools/aspects-report.mjs)', () => {
  const page = readFileSync(join(WORLDS_DIR, 'k.attributes', 'ASPECTS.md'), 'utf8');
  for (const [family] of FAMILIES) assert.ok(page.includes(`| ${family} | `), family);
  assert.ok(page.includes(`| family | things | ${ASPECTS.map((a) => a[0]).join(' | ')} |`));
});

// Q29 (reviewer, 2026-11-13 21:55): the usual colour, "any colour" and the colour of the drawing are separate facts.
import { drawnShards } from '../tools/drawn-colour.mjs';

test('Q29: `any` never stands next to a colour; the drawn colours are what tools/drawn-colour.mjs computes, for every drawing with a filled part', () => {
  const any = things.filter((t) => (t.attrs.colour ?? []).includes('any'));
  assert.ok(any.length >= 100);
  for (const t of any) assert.deepEqual(t.attrs.colour, ['any'], t.id);
  for (const n of ['car', 'ball', 'shirt']) assert.deepEqual(things.find((t) => one(t, 'name') === n).attrs.colour, ['any'], n);
  const { files, rows } = drawnShards();
  for (const [name, text] of Object.entries(files)) assert.equal(readFileSync(join(WORLDS_DIR, 'k.attributes', 'shards', name), 'utf8'), text, name);
  const drawn = world.ofType('k.attributes.drawn');
  assert.equal(drawn.length, rows.length);
  const objects = new Set(fullWorld('k.objects', worlds).ofType('k.objects.object').map((o) => one(o, 'name')));
  assert.ok(objects.size - drawn.length <= 5, 'only drawings made of lines have no drawn colour');
  const shades = new Set(fullWorld('k.values', worlds).ofType('k.values.colour').map((c) => one(c, 'name')));
  for (const d of drawn) {
    assert.ok(objects.has(one(d, 'name')), d.id);
    assert.ok(d.attrs.drawn_colour.length >= 1 && d.attrs.drawn_colour.length <= 3, d.id);
    for (const s of d.attrs.drawn_shade) assert.ok(shades.has(tok(s)), `${d.id}: ${s}`);
    assert.ok(!d.attrs.named, d.id);
  }
  const by = new Map(drawn.map((d) => [one(d, 'name'), d.attrs.drawn_colour]));
  assert.deepEqual(by.get('sun'), ['yellow']);
  assert.deepEqual(by.get('elephant'), ['grey']);
  assert.deepEqual(by.get('tree'), ['green']);
});

// Round 10 item 5: the usual numbers of the common things.
import { numberShards, readNumbers, weightClass, speedClass } from '../tools/numbers-core.mjs';

test('k.attributes.number: the shards are what tools/numbers-core.mjs gives; classes follow the numbers and are steps of the k.values scales; every number has its unit', () => {
  for (const [name, text] of Object.entries(numberShards())) assert.equal(readFileSync(join(WORLDS_DIR, 'k.attributes', 'shards', name), 'utf8'), text, name);
  const numbers = world.ofType('k.attributes.number');
  assert.equal(numbers.length, readNumbers().length);
  assert.ok(numbers.length >= 900);
  const values = fullWorld('k.values', worlds);
  const steps = (scale) => new Set(values.ofType('k.values.step').filter((s) => one(s, 'scale') === scale).map((s) => one(s, 'name')));
  const scale = { weight_class: steps('weight'), speed_class: steps('speed'), price_class: steps('price') };
  const animals = new Set(fullWorld('k.animals', worlds).ofType('k.animals.animal').map((a) => one(a, 'name')));
  for (const n of numbers) {
    assert.equal(one(n, 'named'), 'model', n.id);
    for (const [k, s] of Object.entries(scale)) if (n.attrs[k]) assert.ok(s.has(one(n, k)), `${n.id}: ${k}`);
    assert.equal(one(n, 'weight_class'), weightClass(n.attrs.weight_about ? Number(one(n, 'weight_about')) : undefined), n.id);
    assert.equal(one(n, 'speed_class'), speedClass(n.attrs.speed_about ? Number(one(n, 'speed_about')) : undefined), n.id);
    if (n.attrs.legs) assert.ok(!animals.has(one(n, 'name')), `${n.id}: the legs of an animal are in k.animals`);
  }
  const measures = fullWorld('k.units', worlds).ofType('k.units.measure').filter((m) => one(m, 'world') === 'k.attributes' && one(m, 'type') === 'number').map((m) => one(m, 'key'));
  for (const k of ['size_about', 'weight_about', 'speed_about', 'legs', 'sides']) assert.ok(measures.includes(k), k);
  const by = (name) => numbers.find((n) => one(n, 'name') === name);
  assert.ok(Number(one(by('cow'), 'weight_about')) > Number(one(by('horse'), 'weight_about')), 'a cow is heavier than a horse');
  assert.equal(one(by('elephant'), 'weight_class'), 'heavy');
  assert.equal(one(by('cheetah'), 'speed_class'), 'fast');
  assert.equal(one(by('snail'), 'speed_class'), 'slow');
  assert.equal(one(by('chair'), 'legs'), '4');
  assert.equal(one(by('dice'), 'sides'), '6');
});

// Round 10 item 6: when and by whom the things of k.scenes are used or seen.
import { usageShards, readUsage, roleUses } from '../tools/usage-core.mjs';

test('k.attributes.usage: the shard is what tools/usage-core.mjs gives; every thing is a thing of k.scenes; values are those of k.scenes.scene, k.people.kind and k.people.role; no role is repeated', () => {
  for (const [name, text] of Object.entries(usageShards())) assert.equal(readFileSync(join(WORLDS_DIR, 'k.attributes', 'shards', name), 'utf8'), text, name);
  const usage = world.ofType('k.attributes.usage');
  assert.ok(usage.length >= 300 && usage.length <= readUsage().length);
  const scenes = fullWorld('k.scenes', worlds);
  const sceneThings = new Set(scenes.ofType('k.scenes.thing').map((t) => one(t, 'name')));
  const enumOf = (w, type, key) => [...(schemaWorld(worlds, w).world.schema(type).keys[key].enum ?? [])].map(String).sort();
  const own = schemaWorld(worlds, 'k.attributes').world;
  for (const k of ['season', 'time', 'weather']) assert.deepEqual([...own.schema('k.attributes.usage').keys[k].enum].map(String).sort(), enumOf('k.scenes', 'k.scenes.scene', k), k);
  assert.deepEqual([...own.schema('k.attributes.usage').keys.age.enum].map(String).sort(), enumOf('k.people', 'k.people.kind', 'age'));
  const uses = roleUses(worlds);
  for (const u of usage) {
    assert.equal(one(u, 'named'), 'model', u.id);
    assert.ok(sceneThings.has(one(u, 'name')), `${u.id}: not a thing of k.scenes`);
    for (const r of (u.attrs.used_by ?? []).map(tok)) {
      assert.ok(uses.has(r), `${u.id}: ${r} is no role of k.people`);
      assert.ok(!uses.get(r).has(one(u, 'name')), `${u.id}: ${r} already lists it`);
    }
  }
  const by = (name) => usage.find((u) => one(u, 'name') === name);
  assert.deepEqual(by('sled').attrs.season, ['winter']);
  assert.ok(by('owl').attrs.time.includes('night'));
  assert.ok(by('stethoscope').attrs.used_by.includes('doctor'));
  assert.equal(by('tractor').attrs.used_by, undefined, 'the farmer lists the tractor in k.people');
});

// Q37: a number or usage fact for a name with several senses says which one it is about, and the join files it there.
import { readSenses } from '../tools/lib/senses.mjs';
import { SENSES } from '../tools/joins.mjs';

test('Q37: number and usage facts of a name with several senses say which (sense=), and k.attributes.same files them under it', () => {
  const same = world.ofType('k.attributes.same');
  const sensesOf = new Map();
  for (const s of same) { const n = one(s, 'name'); if (!sensesOf.has(n)) sensesOf.set(n, []); sensesOf.get(n).push(s); }
  const table = readSenses();
  for (const [kind, type] of [['number', 'k.attributes.number'], ['usage', 'k.attributes.usage']]) {
    const facts = world.ofType(type);
    let said = 0;
    for (const f of facts) {
      const name = one(f, 'name'), sense = one(f, 'sense'), all = sensesOf.get(name) ?? [];
      if (all.length < 2) { assert.equal(sense, undefined, `${f.id}: one sense only, no sense= needed`); continue; }
      assert.ok(sense, `${f.id}: ${name} has the senses ${all.map((s) => one(s, 'sense')).join(', ')}; say which`);
      assert.ok(SENSES.includes(sense), `${f.id}: ${sense}`);
      const mine = all.find((s) => one(s, 'sense') === sense);
      assert.ok(mine, `${f.id}: ${name} has no sense ${sense}`);
      assert.ok((mine.attrs.in ?? []).includes(type), `${f.id}: not filed under ${sense}`);
      for (const s of all) assert.ok(!(s.attrs.unsure ?? []).includes(type), `${f.id}: still unsure under ${one(s, 'sense')}`);
      said++;
    }
    assert.equal(said, table[kind].size, `${kind}: every row of senses.tsv is used`);
  }
  const num = (name) => world.ofType('k.attributes.number').find((n) => one(n, 'name') === name);
  assert.equal(one(num('turkey'), 'sense'), 'animal');
  assert.equal(one(num('kiwi'), 'sense'), 'food');
  assert.equal(one(world.ofType('k.attributes.usage').find((u) => one(u, 'name') === 'star'), 'sense'), 'body in space');
});
