// Outlines as arrangement paths (block 09:50 item F, the owner's case: "a diagram in the shape of a house" drew one
// circle): the shards outlines-* of k.layouts (tools/outlines-core.mjs) and the frames of the shard shape-frames of
// w.lang.en (tools/lang-en-shape-frames.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse, arrange } from '../tools/sopworld/sopworld.mjs';
import { WORLDS_DIR, readHeader } from '../tools/lib/worlds.mjs';
import { frameReader } from '../tools/lib/lang-en.mjs';
import { outlines, outlineShards, DRAWINGS, GEOMETRY } from '../tools/outlines-core.mjs';
import { shapeFrameShard } from '../tools/lang-en-shape-frames.mjs';

const dir = join(WORLDS_DIR, 'k.layouts', 'shards');
const files = readdirSync(dir).filter((f) => f.startsWith('outlines-')).sort();
const wires = files.flatMap((f) => parse(readFileSync(join(dir, f), 'utf8')).map((w) => ({ ...w, shard: f })));
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const one = (w, k) => tok(w.attrs[k]?.[0]);
const outs = wires.filter((w) => w.type === 'k.layouts.outline');
const pathOf = (name) => wires.filter((w) => w.type === 'k.layouts.outline_point' && one(w, 'outline') === name).sort((a, b) => one(a, 'n') - one(b, 'n')).map((w) => [Number(one(w, 'x')), Number(one(w, 'y'))]);

test('the outline shards and the shape frames are what their generators give', () => {
  const o = outlines(), want = outlineShards(o);
  assert.deepEqual(files, Object.keys(want).sort());
  for (const [n, t] of Object.entries(want)) assert.equal(readFileSync(join(dir, n), 'utf8'), t, n);
  assert.equal(readFileSync(join(WORLDS_DIR, 'w.lang.en', 'shards', 'shape-frames.sop'), 'utf8'), shapeFrameShard());
  // a drawing is refused only with a reason (in several pieces, too small, too many points)
  for (const [n, why] of o.refused) assert.ok(DRAWINGS.includes(n) && why, n);
});

test('every outline is a closed path in the frame, clockwise from its topmost point, with as many points as it says', () => {
  for (const o of outs) {
    const name = one(o, 'name'), p = pathOf(name);
    assert.equal(p.length, Number(one(o, 'points')), name);
    assert.ok(p.length >= 3 && p.length <= 40, name);
    for (const [x, y] of p) assert.ok(x >= 0 && x <= 100 && y >= 0 && y <= 100, `${name}: ${x} ${y}`);
    const area = p.reduce((s, [x, y], i) => { const [X, Y] = p[(i + 1) % p.length]; return s + (x * Y - X * y); }, 0) / 2;
    assert.ok(area > 0, `${name}: clockwise`);
    assert.ok(p.every(([, y]) => y >= p[0][1]), `${name}: starts at the top`);
    // a geometry comes from k.shapes, a trace from a drawing of the same name, in a shard of the drawing's licence
    if (one(o, 'from') === 'k.shapes.shape') { assert.equal(one(o, 'shape'), name); assert.ok(GEOMETRY[name], name); assert.equal(o.shard, 'outlines-cc0-1-0.sop'); }
    else { assert.equal(one(o, 'drawing'), name); assert.ok(Number(one(o, 'tolerance')) <= 6, name); }
  }
});

test('the owner\'s shapes have outlines: house (a roof on a body), star, heart, tree, arrow, fish, circle, triangle', () => {
  const names = new Set(outs.map((o) => one(o, 'name')));
  for (const n of ['house', 'star', 'heart', 'tree', 'arrow', 'fish', 'circle', 'triangle', 'square', 'cloud']) assert.ok(names.has(n), n);
  const house = pathOf('house');
  assert.ok(house[0][0] > 40 && house[0][0] < 60 && house[0][1] < 20, 'the roof\'s ridge at the top, in the middle');
  assert.ok(house.some(([, y]) => y > 90), 'the body down to the ground');
  assert.equal(pathOf('star').length, 10);
  assert.equal(one(outs.find((o) => one(o, 'name') === 'heart'), 'from'), 'k.objects.object');
  // the licence of a traced outline is the licence of the shard of its drawing
  for (const f of files) assert.match(readHeader(readFileSync(join(dir, f), 'utf8')).license[0], /^(CC0-1\.0|CC-BY-SA-4\.0|Apache-2\.0 AND Unicode-3\.0)$/);
});

const shards = (id) => readdirSync(join(WORLDS_DIR, id, 'shards')).filter((f) => f.endsWith('.sop')).sort().flatMap((f) => parse(readFileSync(join(WORLDS_DIR, id, 'shards', f), 'utf8')));
const read = frameReader(shards('w.lang.en'), shards('k.actions'), { needs: (n) => n === undefined || n === 'layout' });
// [request, act/mode, args]
const REQUESTS = [
  ['make a diagram in the shape of a house', 'make/', { kind: 'diagram', arrangement: 'house' }],
  ['Make a flowchart shaped like a fish.', 'make/', { kind: 'flowchart', arrangement: 'fish' }],
  ['make a house-shaped diagram', 'make/', { arrangement: 'house-shaped', kind: 'diagram' }],
  ['draw a diagram in heart form', 'make/', { kind: 'diagram', arrangement: 'heart' }],
  ['a diagram in the shape of a house', 'make/', { kind: 'diagram', arrangement: 'house' }],
  ['arrange the boxes in the shape of a star', 'place/layout', { thing: 'boxes', arrangement: 'star' }],
  ['arrange the steps in the form of a circle', 'place/layout', { thing: 'steps', arrangement: 'circle' }],
  ['put the nodes in a heart shape', 'place/layout', { thing: 'nodes', arrangement: 'heart' }],
  ['lay the boxes out star-shaped', 'place/layout', { thing: 'boxes', arrangement: 'star-shaped' }],
  ['group the dots in the shape of a heart', 'group/', { thing: 'dots', arrangement: 'heart' }],
];
test('"in the shape of X", "shaped like X", "X-shaped", "in X form": the role arrangement of make and place, an outline\'s name', () => {
  const bad = [];
  for (const [s, am, args] of REQUESTS) { const [r] = read(s); const got = r && [`${r.act}/${r.mode ?? ''}`, r.args]; try { assert.deepEqual(got, [am, args]); } catch { bad.push(`${s} -> ${JSON.stringify(got)}`); } }
  assert.deepEqual(bad, []);
  // not an arrangement: a drawing of a house, a layout said by a phrase
  assert.equal(read('draw a house')[0].args.arrangement, undefined);
  assert.equal(read('arrange them in a circle')[0].frame, 'acts.place.layout');
});

// With a build whose arrange takes a path (sopworld 0.129 and later): eight boxes on the house's edge, the first on its
// ridge. The pinned build before that has no path layout (the test says so and is skipped).
let pathLayout = true;
try { arrange([{ id: 'a' }, { id: 'b' }], 'path', { points: [[0, 0], [10, 0]] }); } catch { pathLayout = false; }
test('arrange along the house\'s outline: eight things on its edge, the first on the ridge', { skip: !pathLayout && 'the pinned sopworld has no path layout (0.129 and later)' }, () => {
  const house = pathOf('house');
  const boxes = arrange(Array.from({ length: 8 }, (_, i) => ({ id: `n${i}`, w: 4, h: 4 })), 'path', { points: house, closed: true });
  assert.equal(boxes.size, 8);
  const first = boxes.get('n0');
  assert.deepEqual([first.x + 2, first.y + 2], house[0]);
});
