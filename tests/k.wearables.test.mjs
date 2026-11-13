// k.wearables (Round 8, item 4): places on the body, wearables, joins to k.objects, k.faces, k.body and k.people.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR, scanWorlds, fullWorld } from '../tools/lib/worlds.mjs';
import { wearableShards, PLACES, WEARABLES } from '../tools/wearables-core.mjs';

const worlds = scanWorlds();
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const one = (w, k) => tok(w.attrs[k]?.[0]);
const world = fullWorld('k.wearables', worlds);
const places = world.ofType('k.wearables.place'), wearables = world.ofType('k.wearables.wearable');
const faces = fullWorld('k.faces', worlds);

test('the shards are what tools/wearables-core.mjs gives', () => {
  for (const [name, text] of Object.entries(wearableShards())) assert.equal(readFileSync(join(WORLDS_DIR, 'k.wearables', 'shards', name), 'utf8'), text, name);
  assert.equal(places.length, PLACES.length); assert.equal(wearables.length, WEARABLES.length);
  assert.ok(wearables.length >= 100);
});

test('places: the box lies on the person drawing near the part it names; face slots and body parts exist', () => {
  const objects = fullWorld('k.objects', worlds);
  const parts = new Map(objects.ofType('k.objects.part').filter((p) => one(p, 'of') === 'person').map((p) => [one(p, 'name'), ['x', 'y', 'w', 'h'].map((k) => Number(one(p, k)))]));
  assert.ok(parts.has('head') && parts.has('left_arm') && parts.has('left_leg'));
  const near = { head: 'head', hair: 'head', eyes: 'head', ears: 'head', face: 'head', arms: 'left_arm', wrist: 'left_arm', hands: 'left_arm', finger: 'left_arm', legs: 'left_leg', feet: 'left_leg' };
  const slots = new Set(faces.ofType('k.faces.slot').filter((s) => one(s, 'style') === 'plain').map((s) => one(s, 'name')));
  const body = new Set(fullWorld('k.body', worlds).ofType('k.body.part').map((p) => one(p, 'name')));
  for (const p of places) {
    const [x, y, w, h] = ['x', 'y', 'w', 'h'].map((k) => Number(one(p, k)));
    assert.ok(x + w <= 100 && y + h <= 100, p.id);
    const part = parts.get(near[one(p, 'name')]);
    if (part) { // the boxes overlap, with a margin of 4 for what sits at the end of a line or on top
      const m = 4;
      assert.ok(x < part[0] + part[2] + m && x + w > part[0] - m && y < part[1] + part[3] + m && y + h > part[1] - m, `${p.id}: not near ${near[one(p, 'name')]}`);
    }
    if (p.attrs.pair) assert.ok(x + w <= 50, `${p.id}: a pair is given by its side on the viewer's left`);
    if (p.attrs.face_slot) assert.ok(slots.has(one(p, 'face_slot')), p.id);
    assert.ok(body.has(one(p, 'body_part')), `${p.id}: body part ${one(p, 'body_part')}`);
    assert.equal(one(p, 'named'), 'model');
  }
});

test('wearables: worn on a place; drawings are k.objects objects; face variants exist in k.faces; what roles wear is here', () => {
  const names = new Set(places.map((p) => one(p, 'name')));
  const objects = new Set(fullWorld('k.objects', worlds).ofType('k.objects.object').map((o) => one(o, 'name')));
  const variants = new Set(faces.ofType('k.faces.variant').filter((v) => one(v, 'style') === 'plain').map((v) => `${one(v, 'slot')} ${one(v, 'name')}`));
  for (const w of wearables) {
    assert.ok(names.has(one(w, 'worn_on')), w.id);
    for (const c of w.attrs.covers ?? []) assert.ok(names.has(tok(c)) && tok(c) !== one(w, 'worn_on'), `${w.id}: covers ${c}`);
    if (w.attrs.drawing) assert.ok(objects.has(one(w, 'drawing')), `${w.id}: drawing ${one(w, 'drawing')}`);
    assert.equal(Boolean(w.attrs.face), Boolean(w.attrs.face_slot), w.id);
    if (w.attrs.face) assert.ok(variants.has(`${one(w, 'face_slot')} ${one(w, 'face')}`), `${w.id}: ${one(w, 'face_slot')} ${one(w, 'face')}`);
    assert.deepEqual(w.attrs['core.source'], ['"hand-core 1"'], w.id);
  }
  assert.ok(wearables.filter((w) => w.attrs.drawing).length >= 85);
  const known = new Set(wearables.map((w) => one(w, 'name')));
  for (const cw of world.ofType('core.word')) for (const t of cw.attrs.text) known.add(tok(t));
  for (const r of fullWorld('k.people', worlds).ofType('k.people.role')) for (const x of r.attrs.wears ?? []) assert.ok(known.has(tok(x)), `${r.id} wears ${x}`);
  const by = new Map(wearables.map((w) => [one(w, 'name'), w]));
  for (const [thing, place] of [['hat', 'head'], ['glasses', 'eyes'], ['earrings', 'ears'], ['scarf', 'neck']]) assert.equal(one(by.get(thing), 'worn_on'), place);
});

test('words reach their shard through the vocabulary index', () => {
  const vocab = JSON.parse(readFileSync(join(WORLDS_DIR, 'vocab.json'), 'utf8'));
  for (const word of ['pants', 'sweater', 'sneakers', 'spectacles', 'wellies']) assert.ok(vocab[word]?.includes('k.wearables/shards/wearables'), word);
});
