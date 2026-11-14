// Every k.objects object is drawable from its facts alone: known shapes, boxes inside the 0-100 frame, points for
// lines and polygons only, relative positions that agree with the boxes, and previews that are up to date.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fullWorld, WORLDS_DIR } from '../tools/lib/worlds.mjs';
import { SHAPES, partsOf, objectsOf, renderAll, fileOf } from '../tools/render-svg.mjs';

const world = fullWorld('k.objects');
const objects = objectsOf(world);
const cx = (p) => p.x + p.w / 2;
const cy = (p) => p.y + p.h / 2;
const TOL = 1;

const handWritten = world.ofType('k.objects.object').filter((o) => o.attrs['core.source'].includes('"hand-core 1"'));
test('there are 328 hand-written objects, and imported ones', () => {
  assert.equal(handWritten.length, 328);
  assert.ok(objects.length >= 30);
  assert.equal(new Set(objects).size, objects.length, 'object names are unique');
});

for (const name of objects) {
  test(`${name} is drawable from its facts`, () => {
    const parts = partsOf(world, name);
    assert.ok(parts.length >= 1);
    const byName = new Map(parts.map((p) => [p.name, p]));
    for (const p of parts) {
      const at = `${name}.${p.name}`;
      assert.ok(SHAPES.includes(p.shape), `${at}: unknown shape ${p.shape}`);
      for (const k of ['x', 'y', 'w', 'h', 'z']) assert.ok(Number.isFinite(p[k]), `${at}: ${k}`);
      assert.ok(p.colour, `${at}: colour`);
      assert.ok(p.x >= 0 && p.y >= 0 && p.x + p.w <= 100 && p.y + p.h <= 100, `${at}: box outside the frame`);
      if (p.shape === 'circle' || p.shape === 'square') assert.equal(p.w, p.h, `${at}: a ${p.shape} has w = h`);
      if (p.shape === 'line' || p.shape === 'polygon') {
        assert.ok(p.points.length >= (p.shape === 'line' ? 2 : 3), `${at}: too few points`);
        assert.deepEqual(p.points.map((q) => q.n), p.points.map((_, i) => i + 1), `${at}: points numbered 1..n`);
        const xs = p.points.map((q) => q.x), ys = p.points.map((q) => q.y);
        const box = [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)];
        box.forEach((v, i) => assert.ok(Math.abs(v - [p.x, p.y, p.w, p.h][i]) < 0.11, `${at}: box is not the bounds of its points`));
      } else {
        assert.equal(p.points.length, 0, `${at}: only lines and polygons have points`);
      }
      const rel = (key, ok) => {
        for (const other of p.attrs[key] ?? []) {
          const o = byName.get(other);
          assert.ok(o, `${at}: ${key}=${other} is not a part of ${name}`);
          assert.ok(ok(p, o), `${at}: ${key} ${other} disagrees with the boxes`);
        }
      };
      rel('above', (a, b) => cy(a) < cy(b));
      rel('below', (a, b) => cy(a) > cy(b));
      rel('left_of', (a, b) => cx(a) < cx(b));
      rel('right_of', (a, b) => cx(a) > cx(b));
      rel('on', (a, b) => cy(a) < cy(b) + TOL);
      rel('inside', (a, b) => a.x >= b.x - TOL && a.y >= b.y - TOL && a.x + a.w <= b.x + b.w + TOL && a.y + a.h <= b.y + b.h + TOL);
      if (p.attrs.centered?.[0] === 'true') assert.ok(Math.abs(cx(p) - 50) <= 2, `${at}: centered but not in the middle`);
    }
  });
}

test('the previews in docs/worlds/k.objects/preview are what the renderer draws now', () => {
  const files = renderAll(world);
  const dir = join(WORLDS_DIR, 'k.objects', 'preview');
  assert.deepEqual(readdirSync(dir).sort(), Object.keys(files).sort());
  for (const object of objects) assert.equal((files[`${fileOf(object)}.svg`].match(/<title>/g) ?? []).length, partsOf(world, object).length + 1, object);
  for (const [name, text] of Object.entries(files)) {
    assert.equal(readFileSync(join(dir, name), 'utf8'), text, name);
    
  }
});
