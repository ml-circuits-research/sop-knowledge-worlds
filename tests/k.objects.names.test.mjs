// sources/<noto-emoji|openmoji|mulberry>/part-names.tsv (R2.7): every named part exists, names are unique inside an object, named parts
// carry named=model, and "what are the parts of <object>" answers with the names.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, fullWorld } from '../tools/lib/worlds.mjs';
import { partsOf, objectsOf } from '../tools/render-svg.mjs';
import { readPartNames } from '../tools/import/noto-emoji.mjs';

const world = fullWorld('k.objects');
const names = readPartNames(['noto-emoji', 'openmoji', 'mulberry'].map((s) => readFileSync(join(REPO, 'sources', s, 'part-names.tsv'), 'utf8')).join('\n'));
const objects = new Set(objectsOf(world));
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);

test('every row of part-names.tsv names a part that exists, as the row says', () => {
  assert.ok(names.size > 0);
  for (const [object, rows] of names) {
    assert.ok(objects.has(object), `${object} is not an object`);
    const parts = partsOf(world, object);
    for (const [n, { name, kind }] of rows) {
      const p = parts[n - 1];
      assert.ok(p, `${object}: no part ${n}`);
      assert.equal(tok(p.attrs.z[0]), String(n));
      assert.equal(p.name, name ?? `part${n}`, `${object} part ${n}`);
      assert.equal(tok(p.attrs.kind?.[0]), kind, `${object} part ${n} kind`);
      assert.equal(tok(p.attrs.named?.[0]), name ? 'model' : undefined, `${object} part ${n} named`);
      if (name) assert.match(name, /^[a-z][a-z0-9_]*$/);
    }
  }
});

test('part names are unique inside an object; only parts named in the TSV carry named=model', () => {
  let named = 0;
  for (const object of objects) {
    const parts = partsOf(world, object);
    assert.equal(new Set(parts.map((p) => p.name)).size, parts.length, object);
    for (const [i, p] of parts.entries()) if (p.attrs.named) { named++; assert.ok(names.get(object)?.get(i + 1)?.name, `${object} ${p.name}`); }
  }
  assert.ok(named > 0);
});

test('"what are the parts of a dog face" answers with the names', () => {
  const a = world.query({ type: 'k.objects.part', where: { of: '"dog face"', named: 'model' }, seek: 'name', mode: 'list' });
  assert.equal(a.status, 'supported');
  assert.deepEqual([...a.values].sort(), ['head', 'left_ear', 'left_eye', 'mouth', 'nose', 'patch', 'right_ear', 'right_eye', 'tongue']);
  const all = world.query({ type: 'k.objects.part', where: { of: '"dog face"' }, seek: 'name', mode: 'list' });
  assert.equal(all.values.length, partsOf(world, 'dog face').length);
  const eyes = world.query({ type: 'k.objects.part', where: { of: '"dog face"', kind: 'eye' }, mode: 'count' });
  assert.equal(eyes.value, '2');
  const wheels = world.query({ type: 'k.objects.part', where: { kind: 'wheel' }, seek: 'of', mode: 'list' });
  for (const o of ['car', 'bicycle', 'taxi']) assert.ok(wheels.values.includes(o), `${o} has wheels`);
});

test('OpenMoji and Mulberry objects have names too; strokes and outlines are details by rule', () => {
  const lights = world.query({ type: 'k.objects.part', where: { of: '"traffic lights"', kind: 'light' }, seek: 'name', mode: 'list' });
  assert.deepEqual([...lights.values].sort(), ['amber_light', 'green_light', 'red_light']);
  const wheels = world.query({ type: 'k.objects.part', where: { kind: 'wheel' }, seek: 'of', mode: 'list' });
  for (const o of ['"car toy"', '"diesel locomotive"', '"cargo bike"']) assert.ok(wheels.values.includes(o), `${o} has wheels`);
  const kettle = partsOf(world, 'kettle');
  assert.equal(kettle.find((p) => p.name === 'body')?.shape, 'polygon');
  for (const p of kettle.filter((q) => q.shape === 'line')) assert.equal(tok(p.attrs.kind?.[0]), 'detail', p.name);
});

test('the audit sample of named parts is seeded: 200 parts over the three sources, the same for the same seed', async () => {
  const { sample, namedRows, SOURCES } = await import('../tools/audit-part-names.mjs');
  const rows = Object.fromEntries(SOURCES.map((s) => [s, namedRows(readFileSync(join(REPO, 'sources', s, 'part-names.tsv'), 'utf8'))]));
  const a = sample(rows, { seed: 4 });
  assert.equal(a.length, 200);
  assert.deepEqual(a, sample(rows, { seed: 4 }));
  assert.notDeepEqual(a, sample(rows, { seed: 5 }));
  for (const s of SOURCES) assert.ok(a.filter((r) => r.source === s).length >= 30, s);
  for (const r of a) assert.equal(partsOf(world, r.object)[r.n - 1]?.name, r.name);
});
