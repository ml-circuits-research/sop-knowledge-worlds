// k.body (Round 9 item 5): the parts of the hand, the eye, the ear and the mouth; counts; a sentence per main organ.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scanWorlds, fullWorld } from '../tools/lib/worlds.mjs';
import { sample } from '../tools/ask-sample.mjs';

const worlds = scanWorlds();
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const one = (w, k) => tok(w.attrs[k]?.[0]);
const body = fullWorld('k.body', worlds);
const parts = body.ofType('k.body.part');
const by = (name) => parts.find((p) => one(p, 'name') === name);
const of = (whole) => parts.filter((p) => one(p, 'part_of') === whole || one(p, 'inside') === whole).map((p) => one(p, 'name'));

test('the hand, the eye, the ear and the mouth have their parts', () => {
  for (const [whole, some] of [['hand', ['finger', 'thumb', 'palm', 'index finger', 'little finger']], ['eye', ['pupil', 'iris', 'eyelid', 'eyelash', 'lens', 'retina']],
    ['ear', ['outer ear', 'earlobe', 'ear canal', 'eardrum', 'inner ear']], ['mouth', ['lip', 'tongue', 'tooth', 'gum', 'palate', 'incisor', 'canine', 'premolar', 'molar']]]) {
    const have = of(whole);
    for (const p of some) assert.ok(have.includes(p), `${whole}: ${p}`);
  }
  for (const p of parts) for (const k of ['part_of', 'inside']) if (p.attrs[k]) assert.ok(by(one(p, k)), `${p.id}: ${k} ${one(p, k)}`);
});

test('the counts agree: 32 teeth of four kinds, 20 milk teeth, 10 fingers and 5 on a hand, 24 ribs, 206 bones', () => {
  const n = (name, k = 'count') => Number(one(by(name), k));
  assert.equal(n('incisor') + n('canine') + n('premolar') + n('molar'), n('tooth'));
  assert.equal(n('milk tooth', 'child_count'), n('tooth', 'child_count'));
  assert.ok(n('wisdom tooth') <= n('molar'));
  assert.equal(n('finger'), n('finger', 'count_per_part') * n('hand'));
  assert.equal(n('toe'), n('toe', 'count_per_part') * n('foot'));
  assert.equal(n('index finger'), n('hand'));
  assert.deepEqual([n('rib'), n('bone'), n('vertebra'), n('eye'), n('lung'), n('kidney')], [24, 206, 33, 2, 2, 2]);
  for (const p of parts) assert.ok(!(p.attrs.count && p.attrs.count_about), p.id);
  assert.equal(body.fork().tell('@b1 k.body.part name=whisker kind=part count=4 count_about=5', { ns: 'app' }).ok, false);
});

test('every organ says in one plain sentence what it does; every part carries named=model', () => {
  const organs = parts.filter((p) => one(p, 'kind') === 'organ');
  assert.ok(organs.length >= 14);
  for (const o of organs) assert.match(one(o, 'about') ?? '', /^The .{25,110}\.$/, o.id);
  for (const p of parts) assert.deepEqual(p.attrs.named, ['model'], p.id);
  assert.ok(parts.length >= 90);
});

test('natural questions (Round 9 item 8): of the seeded sample of 100 about the body, at least 88 find a fact', () => {
  const r = sample('body');
  assert.equal(r.asked, 100);
  assert.ok(r.found >= 88, `${r.found} of 100`);
});
