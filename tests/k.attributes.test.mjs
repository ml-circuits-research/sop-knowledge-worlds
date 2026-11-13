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
  assert.ok(!by.get('car').attrs.colour, 'a car has no usual colour');
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
