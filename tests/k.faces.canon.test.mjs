// k.faces block "10:35" (experiment): the style plain placed by a proportion canon (tools/faces-canon.mjs). The maps
// are exact (the canon the drawing already follows gives the shards byte for byte); the adult canon keeps every part
// in its slot and follows its rules; and it loses on the measure that decided to keep the hand-placed output: the
// mouth a third below the nose leaves no room for the moustaches and noses drawn for this style.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { coreShards, VARIANTS } from '../tools/faces-core.mjs';
import { canonTables, slotMaps, CANONS, FITTED, HEAD } from '../tools/faces-canon.mjs';

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

test('the canon the drawing follows places every part where the hand put it (the maps are exact)', () => {
  const now = coreShards();
  const fitted = coreShards(canonTables(FITTED));
  for (const name of Object.keys(now)) assert.equal(fitted[name], now[name], name);
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
