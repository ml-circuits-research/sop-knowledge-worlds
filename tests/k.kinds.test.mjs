// k.kinds: the up edges of the catalog (reviewer 21:55: several parents on several dimensions, for the library's
// cousins). Checks: the shards and PARENTS.md are what tools/kinds-core.mjs writes; the owner's examples (a cow, a
// car); every edge names a fact that says it; licences follow the facts; every parent made here has a parent; going
// up 1-3 layers from a thing reaches the root on several dimensions and down again gives plausible siblings.
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
  for (const t of types) for (const f of F[t]) { const n = f.attrs.name?.[0] ?? f.attrs.word?.[0]; (byName.get(t).get(n) ?? byName.get(t).set(n, []).get(n)).push(f); }
  let checked = 0;
  for (const e of g.edges) {
    if (e.from === 'k.kinds.parent') continue;
    if (e.from === 'k.words.sense') {
      const [word, , n] = e.value.split(/ (noun) /).flatMap((x, i) => (i === 1 ? ['noun'] : [x]));
      const f = (byName.get('k.words.sense').get(word) ?? []).find((x) => x.attrs.pos[0] === 'noun' && x.attrs.n[0] === n);
      assert.ok(f, `${e.name} -> ${e.is_a}: no sense ${e.value}`);
      const vals = e.key === 'kind_of' ? f.attrs.kind_of : f.attrs[e.key];
      assert.ok(vals?.includes(e.is_a) || (e.key === 'kind_of' && vals?.includes(e.name)), `${e.name} -> ${e.is_a}: ${e.value} ${e.key}`);
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
  for (const e of g.edges.filter((x) => (x.dimension !== 'kind' || x.from === 'k.objects.object') && x.key !== 'name')) assert.ok(up.has(e.is_a), `${e.is_a} (parent of ${e.name}) has no parent`);
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
