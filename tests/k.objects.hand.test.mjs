// The hand-written drawings of Round 11 (shards animals-2, plants, land-3, places-3, food-3, vehicles-2, things-3) are
// the home of their facts (reviewer 18:45): tools/objects-hand.mjs and its table are gone, and what the tool checked when
// it wrote them is checked here, on the facts: a known shape and colours, a box inside the 0 to 100 frame, w = h for a
// circle and a square, a whole draw order, pointing only on a triangle and opens only on an arc, part names unique in
// an object, the relations of a part name parts of the same object, and line and polygon points inside their box.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from '../tools/sopworld/sopworld.mjs';
import { WORLDS_DIR, readHeader } from '../tools/lib/worlds.mjs';

const SHARDS = ['animals-2', 'plants', 'land-3', 'places-3', 'food-3', 'vehicles-2', 'things-3'];
const COLOURS = new Set(['black', 'white', 'grey', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'brown']);
const SHAPES = new Set(['rectangle', 'square', 'circle', 'oval', 'triangle', 'arc', 'line', 'polygon']);
const RELATIONS = ['above', 'below', 'inside', 'left_of', 'right_of', 'on'];
const tok = (t) => (typeof t === 'string' && t.startsWith('"') ? JSON.parse(t) : t);
const one = (w, k) => tok(w.attrs[k]?.[0]);
const texts = Object.fromEntries(SHARDS.map((s) => [s, readFileSync(join(WORLDS_DIR, 'k.objects', 'shards', `${s}.sop`), 'utf8')]));
const wires = Object.values(texts).flatMap((t) => parse(t));

test('the hand-written drawings: no script, the hand-core source, objects with parts', () => {
  for (const [s, t] of Object.entries(texts)) assert.equal(readHeader(t).script?.[0], 'none (hand-written)', s);
  for (const w of wires) assert.deepEqual(w.attrs['core.source'], ['"hand-core 1"'], w.id);
  const objects = wires.filter((w) => w.type === 'k.objects.object');
  assert.ok(objects.length >= 100, `${objects.length} objects`);
  for (const o of objects) assert.ok(wires.some((w) => w.type === 'k.objects.part' && one(w, 'of') === one(o, 'name')), `${one(o, 'name')}: no part`);
});

test('every part: a known shape and colours, a box in the frame, w = h for a circle and a square, a whole z, pointing and opens where they belong', () => {
  for (const p of wires.filter((w) => w.type === 'k.objects.part')) {
    const shape = one(p, 'shape'), [x, y, w, h] = ['x', 'y', 'w', 'h'].map((k) => Number(one(p, k)));
    assert.ok(SHAPES.has(shape), `${p.id}: shape ${shape}`);
    assert.ok((p.attrs.colour ?? []).length && p.attrs.colour.every((c) => COLOURS.has(tok(c))), `${p.id}: colours`);
    assert.ok([x, y, w, h].every((n) => n >= 0 && n <= 100) && x + w <= 100.001 && y + h <= 100.001, `${p.id}: the box leaves the frame`);
    if (shape === 'circle' || shape === 'square') assert.equal(w, h, `${p.id}: a ${shape} has w = h`);
    assert.match(String(one(p, 'z')), /^\d+$/, `${p.id}: z`);
    if (p.attrs.pointing) assert.equal(shape, 'triangle', `${p.id}: pointing is for a triangle`);
    if (p.attrs.opens) assert.equal(shape, 'arc', `${p.id}: opens is for an arc`);
  }
});

test('within an object: part names unique, relations name its parts, points inside their part\'s box', () => {
  const parts = wires.filter((w) => w.type === 'k.objects.part');
  const byObject = new Map();
  for (const p of parts) (byObject.get(one(p, 'of')) ?? byObject.set(one(p, 'of'), []).get(one(p, 'of'))).push(p);
  for (const [o, ps] of byObject) {
    const names = ps.map((p) => one(p, 'name'));
    assert.equal(new Set(names).size, names.length, `${o}: a part name twice`);
    for (const p of ps) for (const k of RELATIONS) for (const v of p.attrs[k] ?? []) assert.ok(names.includes(tok(v)), `${p.id}: ${k}=${v} is no part`);
  }
  const box = new Map(parts.map((p) => [p.id, ['x', 'y', 'w', 'h'].map((k) => Number(one(p, k)))]));
  for (const pt of wires.filter((w) => w.type === 'k.objects.point')) {
    const [x, y, w, h] = box.get(one(pt, 'part').replace(/^\$/, ''));
    const px = Number(one(pt, 'x')), py = Number(one(pt, 'y'));
    assert.ok(px >= x - 0.05 && px <= x + w + 0.05 && py >= y - 0.05 && py <= y + h + 0.05, `${pt.id}: outside its part's box`);
  }
  for (const p of parts.filter((q) => ['line', 'polygon'].includes(one(q, 'shape')))) assert.ok(wires.filter((w) => w.type === 'k.objects.point' && one(w, 'part') === `$${p.id}`).length >= 2, `${p.id}: points`);
});
