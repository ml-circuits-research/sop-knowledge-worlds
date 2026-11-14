// Act families in k.actions (reviewer 21:55: the up edges of acts, for the library's cousins): the 16 acts grouped
// by what they do in layers, and by the role they need, each membership with its reason.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR } from '../tools/lib/worlds.mjs';
import { factStore } from '../tools/sopworld/sopworld.mjs';
import { familyShard, ACTS } from '../tools/acts-core.mjs';

const dir = join(WORLDS_DIR, 'k.actions');
const store = factStore([{ id: 'k.actions', schemaText: readFileSync(join(dir, 'schema.sop'), 'utf8'), shards: ['acts', 'families'].map((s) => ({ text: readFileSync(join(dir, 'shards', `${s}.sop`), 'utf8') })) }]);
const tok = (t) => (typeof t === 'string' && t.startsWith('"') ? JSON.parse(t) : t);
const one = (f, k) => tok(f.attrs[k]?.[0]);
const families = new Map(store.facts('k.actions.family').map((f) => [one(f, 'name'), f]));
const members = store.facts('k.actions.member').map((f) => ({ act: one(f, 'act'), family: one(f, 'family'), why: one(f, 'why') }));
const acts = store.facts('k.actions.act').map((f) => one(f, 'name'));
const parentsOf = (n) => (families.get(n)?.attrs.parent ?? []).map(tok);
const up = (n) => { const out = []; let layer = [n]; while (layer.length) { layer = layer.flatMap(parentsOf); out.push(...layer); } return out; };
const famsOf = (act, dim) => members.filter((m) => m.act === act && one(families.get(m.family), 'dimension') === dim).map((m) => m.family);

test('the shard is what tools/acts-core.mjs writes', () => {
  assert.equal(readFileSync(join(dir, 'shards', 'families.sop'), 'utf8'), familyShard());
});

test('every act is in a family of what it does and in one of what it needs; every family named exists, with a reason', () => {
  assert.equal(acts.length, ACTS.length);
  for (const a of acts) {
    assert.ok(famsOf(a, 'does').length >= 1, `${a}: no family`);
    assert.equal(famsOf(a, 'takes').length, 1, `${a}: takes`);
  }
  for (const m of members) { assert.ok(acts.includes(m.act), m.act); assert.ok(families.has(m.family), m.family); assert.ok(m.why.length > 10, `${m.act} ${m.family}`); }
  for (const [n] of families) for (const p of parentsOf(n)) assert.ok(families.has(p), `${n}: parent ${p}`);
  // The reviewer's list: creation/destruction, change of a value, change of place, grouping, questions, view, history.
  for (const f of ['existence', 'creation', 'destruction', 'change of a value', 'change of place', 'structure', 'question', 'view', 'history']) assert.ok(families.has(f), f);
});

test('a layered graph: every family reaches a root in at most 3 layers, no cycle; send is in two families', () => {
  for (const [n] of families) { const u = up(n); assert.ok(u.length <= 3 && !u.includes(n), `${n}: ${u}`); }
  assert.deepEqual(famsOf('send', 'does').sort(), ['change of place', 'keeping']);
  assert.deepEqual(up('creation'), ['existence', 'change of the world']);
});

test('opposites are close: siblings in one family or cousins under one parent', () => {
  for (const f of store.facts('k.actions.act').filter((x) => x.attrs.opposite)) {
    const a = one(f, 'name'), b = one(f, 'opposite');
    const near = (x) => new Set(famsOf(x, 'does').flatMap((m) => [m, ...up(m).slice(0, 1)]));
    assert.ok([...near(a)].some((x) => near(b).has(x)), `${a} / ${b}`);
  }
});

test('what an act needs is read off its roles: make a kind, remove a thing, undo nothing', () => {
  assert.deepEqual(famsOf('make', 'takes'), ['acts on a kind']);
  assert.deepEqual(famsOf('remove', 'takes'), ['acts on a thing']);
  assert.deepEqual(famsOf('undo', 'takes'), ['acts that need no filler']);
  for (const [name, , , rs] of ACTS) {
    const needed = rs.filter((r) => r[2]);
    assert.equal(famsOf(name, 'takes')[0], needed.length ? `acts on a ${needed[0][1]}` : 'acts that need no filler', name);
  }
});
