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
