// k.actions (R7.2): common verbs with who does it, to what, with what, where, the result, the opposite, what undoes it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR, scanWorlds, fullWorld, factsOf } from '../tools/lib/worlds.mjs';
import { actionShards, formsOf } from '../tools/actions-core.mjs';
import { ACTIONS } from '../tools/actions-data.mjs';

const worlds = scanWorlds();
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const one = (w, k) => tok(w.attrs[k]?.[0]);
const world = fullWorld('k.actions', worlds);
const actions = world.ofType('k.actions.action'), similar = world.ofType('k.actions.similar');
const names = new Set(actions.map((w) => one(w, 'name')));

test('the shards are what tools/actions-core.mjs gives; at least 150 actions', () => {
  for (const [name, text] of Object.entries(actionShards())) assert.equal(readFileSync(join(WORLDS_DIR, 'k.actions', 'shards', name), 'utf8'), text, name);
  assert.equal(actions.length, ACTIONS.length);
  assert.ok(actions.length >= 150, `${actions.length} actions`);
  for (const w of [...actions, ...similar]) assert.deepEqual(w.attrs['core.source'], ['"hand-core 1"'], w.id);
});

test('every action says who does it, what comes of it and an example; opposites and undoing name other actions', () => {
  const opposite = new Map(), undone = new Map();
  for (const w of actions) {
    const name = one(w, 'name');
    assert.ok(w.attrs.who.length >= 1, w.id);
    assert.ok(one(w, 'result').length >= 5, w.id);
    const example = one(w, 'example');
    assert.ok(/^[A-Z].*\.$/.test(example), `${w.id}: the example is a sentence`);
    // The example uses the verb: its base form or one of its other forms (for a phrase, the forms of its first word).
    const first = name.split(' ')[0];
    const forms = [first, ...formsOf(first, first === name ? ACTIONS.find((a) => a[0] === name)[11] : {}), ...formsOf(name, ACTIONS.find((a) => a[0] === name)[11]).map((f) => f.split(' ')[0])];
    assert.ok(forms.some((f) => new RegExp(`\\b${f}\\b`, 'i').test(example)), `${w.id}: the example does not use the verb`);
    for (const k of ['opposite', 'undone_by']) for (const v of w.attrs[k] ?? []) assert.ok(names.has(tok(v)) && tok(v) !== name, `${w.id}: ${k} ${v}`);
    if (w.attrs.opposite) opposite.set(name, one(w, 'opposite'));
    if (w.attrs.undone_by) undone.set(name, one(w, 'undone_by'));
  }
  // An opposite is said from both sides.
  for (const [a, b] of opposite) assert.equal(opposite.get(b), a, `${a} is the opposite of ${b}, and ${b} of ${opposite.get(b)}`);
  for (const [a, b] of [['open', 'close'], ['tie', 'untie'], ['fold', 'unfold'], ['melt', 'freeze'], ['wrap', 'unwrap'], ['put on', 'take off'], ['fill', 'empty']]) { assert.equal(undone.get(a), b); assert.equal(undone.get(b), a); }
  assert.ok(opposite.size >= 60 && undone.size >= 40, `${opposite.size} opposites, ${undone.size} undone`);
});

test('joins: where is a k.scenes scene; most tools are a drawing or a part of the body; the verbs of "can" in the cores are actions', () => {
  const scenes = new Set(fullWorld('k.scenes', worlds).ofType('k.scenes.scene').map((w) => one(w, 'name')));
  const drawn = new Set(factsOf('k.objects', ['k.objects.object', 'k.objects.stand_in'], worlds).map((w) => one(w, 'name')));
  const body = new Set(fullWorld('k.body', worlds).ofType('k.body.part').map((w) => one(w, 'name')));
  let tools = 0, known = 0;
  for (const w of actions) {
    for (const v of w.attrs.where ?? []) assert.ok(scenes.has(tok(v)), `${w.id}: where ${v}`);
    for (const v of w.attrs.tool ?? []) { tools++; if (drawn.has(tok(v)) || body.has(tok(v))) known++; }
  }
  assert.ok(known >= tools * 0.85, `${known} of ${tools} tools are a drawing or a part of the body`);
  for (const id of ['k.commonsense', 'k.animals']) {
    const text = worlds.find((x) => x.id === id).shards.map((s) => s.text).join('\n');
    for (const m of text.matchAll(/ can(?:not)?=("[^"]*"|\S+)/g)) assert.ok(names.has(tok(m[1])), `${id}: can=${m[1]} is not an action`);
  }
});

test('verbs that mean nearly the same lead to an action and are not actions themselves; forms by rule', () => {
  for (const w of similar) { assert.ok(names.has(one(w, 'action')), w.id); assert.ok(!names.has(one(w, 'name')), `${w.id}: an action itself`); }
  assert.ok(similar.length >= 350, `${similar.length} similar verbs`);
  assert.deepEqual(formsOf('carry'), ['carries', 'carried', 'carrying']);
  assert.deepEqual(formsOf('bake'), ['bakes', 'baked', 'baking']);
  assert.deepEqual(formsOf('tie'), ['ties', 'tied', 'tying']);
  assert.deepEqual(formsOf('see', { past: 'saw' }), ['sees', 'saw', 'seeing']);
  assert.throws(() => formsOf('pick up'), /three forms/);
  const vocab = JSON.parse(readFileSync(join(WORLDS_DIR, 'vocab.json'), 'utf8'));
  for (const [word, shard] of [['cutting', 'actions-make-change'], ['flew', 'actions-move'], ['stroll', 'actions-move'], ['rub out', 'actions-make-change'], ['repair', 'actions-make-change'], ['giggle', 'actions-mind-talk'], ['took off', 'actions-body-social-nature']]) assert.ok(vocab[word]?.includes(`k.actions/shards/${shard}`), word);
});
