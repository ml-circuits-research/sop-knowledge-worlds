// k.faces block "10:35" and Q47: the style plain is placed by its published proportion canon (k.faces.canon in
// plain-canon.sop; tools/faces-core.mjs reads the facts back and places the parts by them), and the result is the
// drawing byte for byte. The experiment (tools/faces-canon.mjs): the adult canon keeps every part
// in its slot and follows its rules; and it loses on the measure that decided to keep the hand-placed output: the
// mouth a third below the nose leaves no room for the moustaches and noses drawn for this style.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR, scanWorlds, fullWorld } from '../tools/lib/worlds.mjs';
import { coreShards, VARIANTS, CANON, DRAWN, readCanon, canonShard } from '../tools/faces-core.mjs';
import { canonTables, slotMaps, CANONS, HEAD } from '../tools/faces-canon.mjs';

const box = ([, shape, g]) => {
  if (shape === 'line' || shape === 'poly') { const ys = g.map((p) => p[1]); return { top: Math.min(...ys), bottom: Math.max(...ys) }; }
  if (shape === 'circle' || shape === 'square') return { top: g[1], bottom: g[1] + g[2] };
  return { top: g[1], bottom: g[1] + g[3] };
};
const extent = (variants, slot) => variants[slot].map(([name, , parts]) => ({ name, top: Math.min(...parts.map((p) => box(p).top)), bottom: Math.max(...parts.map((p) => box(p).bottom)) }));
const overlaps = (variants, a, b) => {
  let n = 0;
  for (const x of extent(variants, a)) for (const y of extent(variants, b)) if (x.bottom > y.top + 0.5) n++;
  return n;
};

test('Q47: the published canon of plain places every part where the hand drew it, byte for byte', () => {
  const placed = coreShards(); // placed by the canon facts, read back from plain-canon.sop's text
  const drawn = coreShards({ canon: null }); // the drawings where they were drawn
  assert.deepEqual(Object.keys(placed).filter((n) => n !== 'plain-canon.sop'), Object.keys(drawn));
  for (const name of Object.keys(drawn)) assert.equal(placed[name], drawn[name], name);
  const text = readFileSync(join(WORLDS_DIR, 'k.faces', 'shards', 'plain-canon.sop'), 'utf8');
  assert.equal(text, canonShard());
  assert.ok(Buffer.byteLength(text) < 1400, `${Buffer.byteLength(text)} bytes`);
  // The facts load in k.faces, and are the canon the drawing follows: its anchors to within a hundredth of a unit.
  const w = fullWorld('k.faces', scanWorlds());
  const f = w.ofType('k.faces.canon');
  assert.equal(f.length, 1);
  assert.equal(f[0].attrs.style[0], 'plain');
  const c = readCanon(text);
  for (const k of ['eye_line', 'nose_line', 'mouth_line', 'eye_width', 'eye_gap', 'brow_above']) assert.equal(c[k], CANON[k], k);
  const m = slotMaps(c);
  const near = (a, b, what) => assert.ok(Math.abs(a - b) < 0.01, `${what}: ${a} for ${b}`);
  near(m.eyes.ax, DRAWN.eye_x, 'eye x'); near(m.eyes.ay, DRAWN.eye_y, 'eye y'); near(m.eyebrows.ay, DRAWN.brow_y, 'brow line');
  near(m.moustache.ay, DRAWN.nose_y, 'nose line'); near(m.mouth.ay, DRAWN.mouth_y, 'mouth line'); near(m.eyes.sx, 1, 'eye width');
  // A canon placed differently moves the parts: the experiment's adult canon changes the eyes and the mouth.
  const adult = coreShards({ canon: { ...CANONS[0], style: 'plain' } });
  assert.notEqual(adult['plain-eyes.sop'], drawn['plain-eyes.sop']);
  assert.notEqual(adult['plain-mouth.sop'], drawn['plain-mouth.sop']);
});

test('the adult canon: every part stays in its slot, and the lines follow the rules', () => {
  const adult = CANONS.find((c) => c.name === 'adult');
  const files = coreShards(canonTables(adult)); // throws if a part leaves its slot
  assert.equal(Object.keys(files).length, Object.keys(coreShards()).length);
  const m = slotMaps(adult);
  const Y = (f) => HEAD.y + f * HEAD.h;
  const ew = adult.eye_width * HEAD.w;
  assert.ok(Math.abs(m.eyes.ay - Y(0.5)) < 1e-9, 'the eyes on the middle line');
  assert.ok(Math.abs((50 - m.eyes.ax) * 2 - 2 * ew) < 1e-9, 'one eye width between the eyes');
  assert.ok(Math.abs(Y(adult.nose_line) - (Y(adult.eye_line) + Y(1)) / 2) < 1e-9, 'the nose halfway between the eyes and the chin');
  assert.ok(Math.abs(Y(adult.mouth_line) - (Y(adult.nose_line) + (Y(1) - Y(adult.nose_line)) / 3)) < 0.1, 'the mouth a third from the nose to the chin');
  for (const c of CANONS) assert.ok(c.eye_line < c.nose_line && c.nose_line < c.mouth_line && c.mouth_line < 1, c.name);
});

test('the measure that kept the hand-placed output: the adult canon puts moustaches and noses on the mouth', () => {
  const adult = canonTables(CANONS.find((c) => c.name === 'adult')).variants;
  assert.equal(overlaps(VARIANTS, 'moustache', 'mouth'), 0);
  assert.equal(overlaps(VARIANTS, 'nose', 'mouth'), 0);
  assert.equal(overlaps(VARIANTS, 'eyebrows', 'eyes'), 0);
  assert.ok(overlaps(adult, 'moustache', 'mouth') >= 30, 'moustache on the mouth');
  assert.ok(overlaps(adult, 'nose', 'mouth') >= 30, 'nose on the mouth');
});
