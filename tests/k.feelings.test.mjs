// k.feelings (R7.4): 30 feelings, joined to k.faces by expression and by variants.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR, scanWorlds, fullWorld } from '../tools/lib/worlds.mjs';
import { feelingShards, FEELINGS } from '../tools/feelings-core.mjs';
import { presetFace, composeFace } from '../tools/render-faces.mjs';

const worlds = scanWorlds();
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const world = fullWorld('k.feelings', worlds);
const feelings = world.ofType('k.feelings.feeling');
const faces = fullWorld('k.faces', worlds);
const expressions = new Set(faces.ofType('k.faces.expression').filter((w) => tok(w.attrs.style[0]) === 'plain').map((w) => tok(w.attrs.name[0])));
const variants = new Set(faces.ofType('k.faces.variant').filter((w) => tok(w.attrs.style[0]) === 'plain').map((w) => `${tok(w.attrs.slot[0])} ${tok(w.attrs.name[0])}`));

test('the shard is what tools/feelings-core.mjs gives; 30 feelings', () => {
  for (const [name, text] of Object.entries(feelingShards())) assert.equal(readFileSync(join(WORLDS_DIR, 'k.feelings', 'shards', name), 'utf8'), text, name);
  assert.equal(feelings.length, FEELINGS.length);
  assert.ok(feelings.length >= 30);
});

test('every feeling shows on a face: a k.faces expression or variants that exist; it has causes and a kind reply', () => {
  const names = new Set(feelings.map((w) => tok(w.attrs.name[0])));
  for (const w of feelings) {
    const slots = ['mouth', 'eyebrows', 'eyes', 'cheeks'].filter((s) => w.attrs[s]);
    assert.ok(w.attrs.expression || slots.length >= 2, `${w.id}: how does a face show it?`);
    for (const e of w.attrs.expression ?? []) assert.ok(expressions.has(tok(e)), `${w.id}: expression ${e}`);
    for (const s of slots) assert.ok(variants.has(`${s} ${tok(w.attrs[s][0])}`), `${w.id}: ${s} ${w.attrs[s][0]}`);
    assert.ok(w.attrs.caused_by.length >= 2, `${w.id}: causes`);
    assert.ok(tok(w.attrs.reply[0]).length > 15, `${w.id}: reply`);
    for (const o of w.attrs.opposite ?? []) assert.ok(names.has(tok(o)) && tok(o) !== tok(w.attrs.name[0]), `${w.id}: opposite ${o}`);
    assert.deepEqual(w.attrs['core.source'], ['"hand-core 1"'], w.id);
    // The face composes: the preset child with the expression and the variants of the feeling.
    const face = presetFace(faces, 'child', tok(w.attrs.expression?.[0]));
    for (const s of slots) face.pick[s] = tok(w.attrs[s][0]);
    assert.ok(composeFace(faces, face).length > 5, w.id);
  }
  const opposite = Object.fromEntries(feelings.filter((w) => w.attrs.opposite).map((w) => [tok(w.attrs.name[0]), tok(w.attrs.opposite[0])]));
  for (const [a, b] of [['happy', 'sad'], ['excited', 'bored'], ['proud', 'ashamed'], ['lonely', 'loved']]) { assert.equal(opposite[a], b); assert.equal(opposite[b], a); }
});

test('other words reach the feeling through the vocabulary index', () => {
  const vocab = JSON.parse(readFileSync(join(WORLDS_DIR, 'vocab.json'), 'utf8'));
  for (const word of ['scared', 'glad', 'mad', 'fear', 'anxious', 'thankful', 'sleepy']) assert.ok(vocab[word]?.includes('k.feelings/shards/feelings'), word);
});
