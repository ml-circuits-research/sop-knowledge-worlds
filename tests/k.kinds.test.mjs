// k.kinds: the up edges of the catalog (reviewer 21:55: several parents on several dimensions, for the library's
// cousins). Checks: the shards and PARENTS.md are what tools/kinds-core.mjs writes; the owner's examples (a cow, a
// car); every edge names a fact that says it; licences follow the facts; every parent made here has a parent; going
// up 1-3 layers from a thing reaches the root on several dimensions and down again gives plausible siblings; Q59: the
// part_of and origin edges are derived from their facts (from=), and edges of names with two senses carry `sense`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR, scanWorlds, readHeader } from '../tools/lib/worlds.mjs';
import { kindsGraph, kindsShards, parentsReport, readFacts, PARENTS_PAGE, GROUPS, DIMENSIONS } from '../tools/kinds-core.mjs';

const worlds = scanWorlds();
const g = kindsGraph(worlds);
const dir = join(WORLDS_DIR, 'k.kinds', 'shards');
// the shards of tools/kinds-core.mjs (arguments, relations-* and structures are tools/relations-core.mjs' and
// tools/structures-core.mjs', tested in tests/k.kinds.relations.test.mjs)
const ownShard = (f) => f.endsWith('.sop') && !/^(arguments|relations-|structures)/.test(f);
const up = new Map();
for (const e of [...g.edges, ...g.told]) (up.get(e.name) ?? up.set(e.name, []).get(e.name)).push(e);
const parents = (n) => (up.get(n) ?? []).map((e) => e.is_a).sort();

test('the shards and PARENTS.md are what tools/kinds-core.mjs writes (byte-identical)', () => {
  const files = kindsShards(g, worlds);
  assert.deepEqual(readdirSync(dir).filter(ownShard).sort(), Object.keys(files).sort());
  for (const [n, t] of Object.entries(files)) assert.equal(readFileSync(join(dir, n), 'utf8'), t, n);
  assert.equal(readFileSync(PARENTS_PAGE, 'utf8'), parentsReport(g).text);
});

test('the owner\'s examples: a cow is a mammal, a farm animal and an animal with legs; a car a vehicle, a machine and a thing with wheels', () => {
  const dims = (n) => Object.fromEntries((up.get(n) ?? []).map((e) => [e.is_a, e.dimension]));
  assert.deepEqual({ mammal: 'kind', 'farm animal': 'place', 'animal with legs': 'feature', cattle: 'kind', herbivore: 'diet' }, Object.fromEntries(Object.entries(dims('cow')).filter(([k]) => ['mammal', 'farm animal', 'animal with legs', 'cattle', 'herbivore'].includes(k))));
  assert.deepEqual({ vehicle: 'kind', machine: 'feature', 'thing with wheels': 'feature', 'motor vehicle': 'kind', 'thing for travelling': 'use', 'thing made of metal': 'material' }, Object.fromEntries(Object.entries(dims('car')).filter(([k]) => ['vehicle', 'machine', 'thing with wheels', 'motor vehicle', 'thing for travelling', 'thing made of metal'].includes(k))));
  // A railway car (WordNet car 2, in the chain of carriage) does not make the car a wheeled vehicle directly.
  assert.ok(!parents('car').includes('wheeled vehicle'));
  // Several parents on several dimensions for most things.
  const r = parentsReport(g);
  assert.ok(r.multi >= 900 && r.none.length <= 80, `${r.multi} things on 2+ dimensions, ${r.none.length} with none`);
});

test('every edge names the fact it is read from', () => {
  const types = [...new Set(g.edges.map((e) => e.from).filter((t) => t !== 'k.kinds.parent'))];
  const F = readFacts(types, worlds);
  const byName = new Map(types.map((t) => [t, new Map()]));
  for (const t of types) for (const f of F[t]) { const n = f.attrs.name?.[0] ?? f.attrs.word?.[0] ?? f.attrs.of?.[0]; (byName.get(t).get(n) ?? byName.get(t).set(n, []).get(n)).push(f); }
  let checked = 0;
  for (const e of g.edges) {
    if (e.from === 'k.kinds.parent') continue;
    if (e.from === 'k.words.sense') {
      const [word, , n] = e.value.split(/ (noun) /).flatMap((x, i) => (i === 1 ? ['noun'] : [x]));
      const f = (byName.get('k.words.sense').get(word) ?? []).find((x) => x.attrs.pos[0] === 'noun' && x.attrs.n[0] === n);
      assert.ok(f, `${e.name} -> ${e.is_a}: no sense ${e.value}`);
      const vals = e.key === 'kind_of' ? f.attrs.kind_of : f.attrs[e.key];
      assert.ok(vals?.includes(e.is_a) || (e.key === 'kind_of' && vals?.includes(e.name)), `${e.name} -> ${e.is_a}: ${e.value} ${e.key}`);
    } else if (e.dimension === 'part_of' && e.from.startsWith('k.parts.')) {
      // A part of a thing: the fact is the thing's (name or of = is_a) and names the part (has, plain or part).
      const fs = byName.get(e.from).get(e.is_a) ?? [];
      assert.ok(e.value === e.name && fs.some((f) => (f.attrs[e.key] ?? []).includes(e.value)), `${e.name} -> ${e.is_a}: ${e.from} ${e.key}=${e.value}`);
    } else if (e.key === 'name') {
      assert.ok(e.name.toLowerCase().includes(e.is_a.replace(/y$/, '')) && byName.get(e.from).has(e.name), `${e.name} -> ${e.is_a}: head`);
    } else {
      const fs = byName.get(e.from).get(e.name) ?? [];
      assert.ok(fs.length, `${e.name}: no ${e.from}`);
      if (e.group) assert.ok(fs.some((f) => f.shard.id.split('/').pop().replace(/-\d+$/, '') === e.group) && GROUPS[e.group] === e.is_a, `${e.name}: group ${e.group}`);
      else assert.ok(fs.some((f) => (f.attrs[e.key] ?? []).includes(e.value ?? e.is_a)), `${e.name} -> ${e.is_a}: ${e.from} ${e.key}=${e.value ?? e.is_a}`);
    }
    checked += 1;
  }
  assert.ok(checked > 7000, `${checked} edges checked`);
});

test('licences follow the facts: WordNet edges in WordNet shards, share-alike drawing groups in their own shards, hand facts in CC0 shards', () => {
  for (const f of readdirSync(dir).filter(ownShard)) {
    const text = readFileSync(join(dir, f), 'utf8'), h = readHeader(text);
    const sources = new Set([...text.matchAll(/core\.source="([^"]+)"/g)].map((m) => m[1].split(' ')[0]));
    if (h.license[0] === 'CC0-1.0') assert.ok([...sources].every((x) => x === 'hand-core' || x === 'psys2-worlds'), `${f}: ${[...sources]}`); // psys2-worlds: CC0, the project's own data
    if (sources.has('wordnet')) assert.equal(h.license[0], 'WordNet-3.0', f);
    if (sources.has('mulberry') || sources.has('openmoji')) assert.match(h.license[0], /CC-BY-SA/, f);
    if (sources.has('noto-emoji')) assert.match(h.license[0], /Apache-2.0/, f);
    for (const l of text.split('\n').filter((x) => x.startsWith('@'))) assert.ok(DIMENSIONS.some((d) => l.includes(` dimension=${d} `)), l);
  }
});

test('every parent made here has a parent of its own, so the graph goes up from every thing to the root', () => {
  for (const e of g.edges.filter((x) => (x.dimension !== 'kind' || x.from === 'k.objects.object') && x.key !== 'name' && x.dimension !== 'part_of' && x.dimension !== 'origin')) assert.ok(up.has(e.is_a), `${e.is_a} (parent of ${e.name}) has no parent`);
  // The head of a name is a thing of the catalog or has a WordNet sense; most heads have parents of their own.
  const heads = g.edges.filter((x) => x.key === 'name');
  assert.ok(heads.filter((e) => up.has(e.is_a)).length / heads.length > 0.9, 'heads with parents');
  // Up 1-3 layers from a cow: the root of animals on every dimension.
  const reach = (n, k) => { let layer = new Set([n]); const seen = new Map(); for (let i = 1; i <= k; i += 1) { const next = new Set(); for (const x of layer) for (const e of up.get(x) ?? []) { if (!seen.has(e.is_a)) seen.set(e.is_a, i); next.add(e.is_a); } layer = next; } return seen; };
  const r = reach('cow', 3);
  assert.equal(r.get('animal'), 1);
  for (const p of ['farm animal', 'animal with legs', 'herbivore', 'mammal']) assert.equal(r.get(p), 1, p);
  assert.ok(r.has('vertebrate') && r.has('bovid'), [...r.keys()].join(', '));
});

test('down again: the siblings of a cow on the dimension place are farm animals, on diet herbivores; of a car on feature, things with wheels', () => {
  const below = new Map();
  for (const e of g.edges) (below.get(e.is_a) ?? below.set(e.is_a, []).get(e.is_a)).push(e.name);
  const sib = (n, p) => (below.get(p) ?? []).filter((x) => x !== n).sort();
  for (const s of ['pig', 'sheep', 'horse', 'goose']) assert.ok(sib('cow', 'farm animal').includes(s), s);
  for (const s of ['goat', 'horse', 'rabbit']) assert.ok(sib('cow', 'herbivore').includes(s), s);
  for (const s of ['tram', 'bicycle', 'truck']) assert.ok(sib('car', 'thing with wheels').includes(s), s);
  for (const s of ['motorcycle']) assert.ok(sib('car', 'machine').includes(s), s);
  console.log(`siblings: cow on place ${sib('cow', 'farm animal').length}, on diet ${sib('cow', 'herbivore').length}; car on wheels ${sib('car', 'thing with wheels').length}, machine ${sib('car', 'machine').length}`);
});

test('Q59 (1, 2): part_of and origin edges, derived at build from k.parts, k.body and k.food; the fact stays the one home', () => {
  const of = (n, d) => g.edges.filter((e) => e.name === n && e.dimension === d);
  const edge = (n, p) => g.edges.find((e) => e.name === n && e.is_a === p);
  // A wheel is part of a car (the plain word of WordNet's car wheel, a part of a motor vehicle), a fuselage of an aeroplane.
  assert.deepEqual([edge('wheel', 'car')?.dimension, edge('car wheel', 'car')?.key], ['part_of', 'has']);
  assert.equal(edge('wheel', 'car').from, 'k.parts.inherited');
  assert.equal(edge('fuselage', 'aeroplane')?.from, 'k.parts.whole');
  assert.equal(edge('eyebrow', 'face')?.from, 'k.body.part');
  assert.equal(edge('leg', 'ant')?.from, 'k.parts.usual');
  assert.deepEqual(['beef', 'cheese', 'apple', 'carrot'].map((n) => of(n, 'origin').map((e) => `${e.is_a} ${e.key}`).join()), ['cow comes_from', 'milk comes_from', 'tree grows_on', 'underground grows_on']);
  // Cousins through part_of: the other parts of a car, and up from the car (a vehicle) to the parts of other vehicles.
  const below = new Map();
  for (const e of g.edges) (below.get(`${e.is_a}\t${e.dimension}`) ?? below.set(`${e.is_a}\t${e.dimension}`, new Set()).get(`${e.is_a}\t${e.dimension}`)).add(e.name);
  const parts = (w) => below.get(`${w}\tpart_of`) ?? new Set();
  for (const p of ['door', 'bumper', 'engine', 'car seat']) assert.ok(parts('car').has(p), p);
  const vehicles = [...(below.get('vehicle\tkind') ?? [])].filter((v) => v !== 'car' && parts(v).has('wheel'));
  assert.ok(vehicles.length >= 5, vehicles.join(', '));
  assert.ok(parts('cow').size === 0 || !parts('cow').has('beef'), 'origin is not part_of');
  for (const s of ['butter', 'cheese', 'yogurt']) assert.ok((below.get('milk\torigin') ?? new Set()).has(s), s);
  // Derived, never a hand copy: every part_of or origin edge names its fact by from, key and value; no other edge
  // relates the same pair; they sit in shards of their own (part_of, part_of-wordnet-*, origin).
  const pairs = new Map();
  for (const e of g.edges) pairs.set(`${e.name}\t${e.is_a}`, (pairs.get(`${e.name}\t${e.is_a}`) ?? 0) + 1);
  for (const e of g.edges.filter((x) => x.dimension === 'part_of' || x.dimension === 'origin')) {
    assert.ok(['k.parts.whole', 'k.parts.inherited', 'k.parts.usual', 'k.parts.called', 'k.body.part', 'k.food.food'].includes(e.from) && e.key && e.value, `${e.name} -> ${e.is_a}`);
    assert.equal(pairs.get(`${e.name}\t${e.is_a}`), 1, `${e.name} -> ${e.is_a}`);
  }
  for (const f of readdirSync(dir).filter(ownShard)) {
    const dims = new Set([...readFileSync(join(dir, f), 'utf8').matchAll(/ dimension=(\S+)/g)].map((m) => m[1]));
    if (dims.has('part_of') || dims.has('origin')) assert.ok(/^(part_of|origin)/.test(f) && dims.size === 1, f);
  }
});

test('Q59 (3): the edges of a name with two senses say which sense they are about', () => {
  const sensed = g.edges.filter((e) => e.sense);
  for (const e of sensed) {
    const l = g.two.get(e.name.toLowerCase());
    assert.ok(l?.some((x) => x.sense === e.sense), `${e.name}: ${e.sense}`);
    // Read from a fact of a type: the sense whose types hold that type (a WordNet edge: the sense that chose it).
    if (e.from !== 'k.words.sense') assert.ok(l.find((x) => x.sense === e.sense).in.has(e.from), `${e.name} -> ${e.is_a}: ${e.from}`);
  }
  // Only names with two senses carry it, and most of their edges do.
  assert.ok(g.edges.every((e) => !e.sense || g.two.has(e.name.toLowerCase())));
  const two = g.edges.filter((e) => g.two.has(e.name.toLowerCase()));
  assert.ok(sensed.length / two.length > 0.7, `${sensed.length} of ${two.length}`);
  const at = (n, p) => g.edges.filter((e) => e.name === n && e.is_a === p).map((e) => e.sense).sort();
  assert.deepEqual([at('crane', 'bird'), at('crane', 'tool'), at('turkey', 'bird'), at('turkey', 'meat'), at('chicken', 'hen')], [['animal'], ['thing'], ['animal'], ['food'], ['food']]);
  // One pair, two senses, two edges (cod the fish and cod the food are both "fish").
  assert.deepEqual(at('cod', 'fish'), ['animal', 'food']);
  // The wire ids stay unique: the sense is part of the id of a sensed edge.
  const ids = Object.values(kindsShards(g, worlds)).flatMap((t) => t.split('\n').filter((l) => l.startsWith('@')).map((l) => l.slice(1, l.indexOf(' '))));
  assert.equal(new Set(ids).size, ids.length);
});
