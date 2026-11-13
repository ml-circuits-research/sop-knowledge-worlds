// k.food (Round 9 item 6): what dishes and made foods are made of; the usual colour is a colour of k.colours.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scanWorlds, fullWorld } from '../tools/lib/worlds.mjs';
import { sample } from '../tools/ask-sample.mjs';

const worlds = scanWorlds();
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const one = (w, k) => tok(w.attrs[k]?.[0]);
const foods = fullWorld('k.food', worlds).ofType('k.food.food');
const names = new Set(foods.map((f) => one(f, 'name')));

test('what a food is made of is a food, or one of a few general words; nothing is made of itself', () => {
  const general = new Set(['water', 'yeast', 'vinegar', 'spices', 'herbs', 'vegetables', 'fruit', 'meat', 'fish', 'seafood', 'nuts', 'grain', 'oil', 'gelatine', 'seaweed',
    'cocoa beans', 'tea leaves', 'coffee beans', 'mustard seeds', 'sunflower seeds']);
  let said = 0;
  for (const f of foods) for (const v of f.attrs.made_of ?? []) {
    said++;
    assert.ok(names.has(tok(v)) || general.has(tok(v)), `${f.id} made_of=${v}`);
    assert.notEqual(tok(v), one(f, 'name'), f.id);
  }
  const made = foods.filter((f) => f.attrs.made_of?.length);
  assert.ok(made.length >= 115 && said >= 300, `${made.length} foods, ${said} ingredients`);
  for (const f of foods) if (one(f, 'kind') === 'dish') assert.ok(f.attrs.made_of?.length, `${f.id}: a dish says what it is made of`);
  const of = (name) => foods.find((f) => one(f, 'name') === name).attrs.made_of.map(tok);
  assert.deepEqual(of('bread'), ['flour', 'water', 'yeast', 'salt']);
  assert.deepEqual(of('pizza'), ['flour', 'tomato', 'cheese']);
});

test('the usual colour of a food is a colour of k.colours; every food carries named=model', () => {
  const colours = new Set(fullWorld('k.colours', worlds).ofType('k.colours.colour').map((c) => one(c, 'name')));
  let said = 0;
  for (const f of foods) {
    for (const c of f.attrs.colour ?? []) { said++; assert.ok(colours.has(tok(c)), `${f.id} colour=${c}`); }
    assert.deepEqual(f.attrs.named, ['model'], f.id);
  }
  assert.ok(foods.length >= 225 && foods.filter((f) => f.attrs.colour).length >= 150, `${foods.length} foods, ${said} colours`);
});

test('natural questions (Round 9 item 8): of the seeded sample of 100 about food, at least 88 find a fact', () => {
  const r = sample('food');
  assert.equal(r.asked, 100);
  assert.ok(r.found >= 88, `${r.found} of 100`);
});
