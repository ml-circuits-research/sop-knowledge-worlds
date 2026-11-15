// k.commonsense rules about kinds (Round 11 item 4): facts made from the facts of k.animals and k.food, a thing on
// a carrier that goes where the carrier goes, a liquid that needs something to hold it, and the sky rule that
// lets a rider fly. Each with a small world of its own, and once with the whole catalog.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../tools/sopworld/sopworld.mjs';
import { scanWorlds, library, fullWorld } from '../tools/lib/worlds.mjs';

const worlds = scanWorlds();
const small = (facts) => {
  const w = new World({ library: library(worlds) });
  assert.equal(w.use('k.commonsense').ok, true);
  const r = w.tell(facts);
  assert.equal(r.ok, true, JSON.stringify(r.violations));
  return w;
};
const val = (t) => (/^[a-z][a-z0-9_-]*$/.test(t) ? t : JSON.stringify(t));
const at = (w, name) => w.ask(`k.commonsense.thing name=${val(name)} at=?a`).map((x) => x.a).sort();
// the issues of the soft rules; a join still open (a declared `type=T by=k` whose target world is not loaded here,
// Q61) is a report of its own, not a rule's issue
const ruleIssues = (w) => (w.check().issues ?? []).filter((i) => i.kind !== 'open-join');
const issues = (w) => ruleIssues(w).map((i) => i.rule).sort();

test('lives in gives the usual place: the habitat itself, and water or ground through k.commonsense.lives', () => {
  const w = small(`
    @a k.animals.animal name=shark class=fish habitat=sea can=swim cannot=fly core.source="t"
    @l k.commonsense.lives in=sea at=water core.source="t"`);
  assert.deepEqual(at(w, 'shark'), ['sea', 'water']);
  assert.deepEqual(w.ask('k.commonsense.thing name=shark cannot=?v').map((x) => x.v), ['fly']);
  assert.deepEqual(w.ask('k.commonsense.thing name=shark can=?v').map((x) => x.v), ['swim']);
});

test('the soft rules now reach every animal: a shark in the sky is an issue, a duck in the sky is not', () => {
  const w = small(`
    @a k.animals.animal name=shark class=fish habitat=sea cannot=fly core.source="t"
    @b k.animals.animal name=duck class=bird habitat=pond habitat=farm can=fly can=swim core.source="t"
    @l1 k.commonsense.lives in=sea at=water core.source="t"
    @l2 k.commonsense.lives in=pond at=water core.source="t"
    @l3 k.commonsense.lives in=farm at=ground core.source="t"
    @p1 k.commonsense.placed thing=shark at=sky scene=s core.source="t"
    @p2 k.commonsense.placed thing=duck at=sky scene=s core.source="t"
    @p3 k.commonsense.placed thing=duck at=grass scene=s core.source="t"`);
  assert.deepEqual(issues(w), ['k.commonsense.k.commonsense.nofly', 'k.commonsense.k.commonsense.water.sky']);
  assert.ok(ruleIssues(w).every((i) => /shark/.test(i.why)));
});

test('a thing on a carrier is where the carrier is, and moves with it; a rider in the sky is no issue', () => {
  const w = small(`
    @a k.animals.animal name=cat class=mammal habitat=house cannot=fly core.source="t"
    @plane k.commonsense.placed thing=plane at=sky scene=s core.source="t"
    @cat k.commonsense.placed thing=cat on=plane scene=s core.source="t"`);
  assert.deepEqual(w.ask('k.commonsense.placed thing=cat at=?p').map((x) => x.p), ['sky']);
  assert.deepEqual(issues(w), []);
  w.retract('plane');
  assert.equal(w.tell('@plane2 k.commonsense.placed thing=plane at=airport scene=s core.source="t"').ok, true);
  assert.deepEqual(w.ask('k.commonsense.placed thing=cat at=?p').map((x) => x.p), ['airport']);
  // A cat in the sky with nothing to carry it is an issue.
  assert.equal(w.tell('@cat2 k.commonsense.placed thing=cat at=sky scene=t core.source="t"').ok, true);
  assert.deepEqual(issues(w), ['k.commonsense.k.commonsense.nofly']);
});

test('a liquid needs something to hold it; a drink of k.food is a liquid', () => {
  const w = small(`
    @f k.food.food name=milk kind=drink core.source="t"
    @p1 k.commonsense.placed thing=milk at=table scene=s core.source="t"
    @p2 k.commonsense.placed thing=milk in=cup at=table scene=s core.source="t"`);
  assert.deepEqual(w.ask('k.commonsense.thing name=milk is_a=?k').map((x) => x.k), ['liquid']);
  const found = ruleIssues(w);
  assert.equal(found.length, 1);
  assert.equal(found[0].rule, 'k.commonsense.k.commonsense.liquid');
});

test('with the catalog: every animal of k.animals has a usual place; the water habitats give water', () => {
  const w = fullWorld('k.commonsense', worlds);
  const animals = w.ofType('k.animals.animal');
  assert.ok(animals.length >= 300);
  for (const a of animals) {
    const raw = a.attrs.name[0], name = raw.startsWith('"') ? JSON.parse(raw) : raw;
    if ((a.attrs.habitat ?? []).length) assert.ok(at(w, name).length > 0, name);
  }
  assert.ok(at(w, 'dolphin').includes('water'));
  assert.ok(at(w, 'camel').includes('ground'));
  assert.deepEqual(w.ask('k.commonsense.thing name=penguin cannot=?v').map((x) => x.v), ['fly']);
  assert.ok(w.ask('k.commonsense.thing name=?t is_a=liquid').length >= 15);
});

// KR1 item 4 (review 2026-11-15, finding 6): thing facts were split between k.attributes.thing (material, can,
// used_for) and k.commonsense.thing (made_of, can, used_for) and had drifted: a car "can move, used for travelling"
// in one and "can drive, used for travel" in the other.
test('KR1 item 4: what a thing is made of, can do and is used for has one home, k.attributes.thing, under one key each', async () => {
  const { parse } = await import('../tools/sopworld/sopworld.mjs');
  const { factsOf } = await import('../tools/lib/worlds.mjs');
  const cs = worlds.find((w) => w.id === 'k.commonsense');
  const slots = parse(cs.schemaText).filter((x) => x.type === 'core.slot' && x.attrs.of?.[0] === 'k.commonsense.thing').map((x) => x.attrs.key[0]);
  for (const k of ['made_of', 'used_for', 'material']) assert.ok(!slots.includes(k), `k.commonsense.thing.${k}`);
  // told shards say where a thing is and how many; can and cannot come only from the rules (shard derived)
  for (const s of cs.shards.filter((x) => !x.id.endsWith('/derived'))) for (const w of parse(s.text)) if (w.type === 'k.commonsense.thing') for (const k of ['can', 'cannot', 'made_of', 'used_for']) assert.ok(!w.attrs[k], `${s.id} @${w.id} ${k}`);
  for (const w of parse(cs.shards.find((x) => x.id.endsWith('/derived')).text)) if (w.attrs.can || w.attrs.cannot) assert.match(w.attrs['core.source'][0], /^"rule k\.commonsense\.(in)?ability"$/, w.id);
  // no other world calls a thing's material made_of (k.food.food.made_of is the ingredients of a dish; k.space: Q72)
  const things = new Map(factsOf('k.attributes', 'k.attributes.thing', worlds).map((w) => [w.attrs.name[0], w]));
  const vals = (n, k) => (things.get(n)?.attrs[k] ?? []).map((v) => (v.startsWith('"') ? JSON.parse(v) : v));
  assert.deepEqual([vals('car', 'can'), vals('car', 'used_for'), vals('car', 'material')], [['move'], ['travelling'], ['metal']]);
  assert.deepEqual(vals('boat', 'can'), ['float', 'move', 'sail']);
  assert.deepEqual(vals('house', 'material'), ['brick', 'wood', 'stone']);
  assert.deepEqual([vals('bird', 'can'), vals('fish', 'can'), vals('cloud', 'can'), vals('flower', 'used_for')], [['fly', 'sing'], ['swim'], ['rain'], ['decoration']]);
});
