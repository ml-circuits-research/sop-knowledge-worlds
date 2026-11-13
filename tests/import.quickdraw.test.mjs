// tools/import/quickdraw.mjs on made-up drawings in the format of the simplified files. The Quick, Draw! data is
// not in the repository (sources/quickdraw/SOURCE.md); these drawings are invented for the test.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../tools/sopworld/sopworld.mjs';
import { scanWorlds, library } from '../tools/lib/worlds.mjs';
import { importQuickdraw, skeletonOf, strokeBoxes, matchPart } from '../tools/import/quickdraw.mjs';

// A "house": a square body, then a roof line above it; drawn 30 times with a little jitter, and 5 odd ones.
const house = (j) => [[[0, 200, 200, 0, 0], [100 + j, 100 + j, 255, 255, 100 + j]], [[0, 100, 200], [100 + j, 0, 100 + j]]];
const drawings = [...Array.from({ length: 30 }, (_, i) => house(i % 5)), ...Array.from({ length: 5 }, () => [[[0, 10], [0, 10]]])];
const scribbles = Array.from({ length: 40 }, (_, i) => [[[0, 255], [(i * 37) % 255, (i * 91) % 255]], [[(i * 53) % 255, (i * 17) % 255], [0, 255]]]);

test('stroke boxes are in the 0 to 100 frame of the drawing', () => {
  assert.deepEqual(strokeBoxes([[[0, 100], [0, 50]], [[100, 200], [50, 100]]]), [{ x: 0, y: 25, w: 50, h: 25 }, { x: 50, y: 50, w: 50, h: 25 }]);
  assert.equal(strokeBoxes([[[5], [5]]]), null);
});

test('a skeleton is the median box per stroke of the drawings with the most common stroke count', () => {
  const sk = skeletonOf(drawings);
  assert.equal(sk.strokes.length, 2);
  assert.equal(sk.drawings, 30);
  assert.equal(sk.usable, true);
  assert.ok(sk.strokes[0].y > sk.strokes[1].y, 'the body is below the roof');
  assert.equal(skeletonOf(scribbles).usable, false);
  assert.equal(matchPart({ x: 10, y: 40, w: 80, h: 60 }, [{ name: 'body', x: 15, y: 45, w: 70, h: 50 }, { name: 'roof', x: 10, y: 10, w: 80, h: 35 }]), 'body');
  assert.equal(matchPart({ x: 0, y: 0, w: 5, h: 5 }, [{ name: 'body', x: 15, y: 45, w: 70, h: 50 }]), undefined);
});

test('usable categories become skeleton facts that load; the report says which are usable', () => {
  const parts = { house: [{ name: 'body', x: 10, y: 40, w: 80, h: 60 }, { name: 'roof', x: 10, y: 0, w: 80, h: 40 }] };
  const run = () => importQuickdraw(new Map([['house', drawings], ['scribble', scribbles]]), { partsOf: (n) => parts[n] ?? [] });
  const { files, report } = run();
  assert.deepEqual(report.map((r) => [r.name, r.usable]), [['house', true], ['scribble', false]]);
  const lines = files['quickdraw-01.sop'].split('\n').filter((l) => l.startsWith('@'));
  assert.equal(lines.length, 2);
  assert.match(lines[0], /^@k\.objects\.sk\.house\.1 k\.objects\.skeleton of=house n=1 x=\S+ y=\S+ w=\S+ h=\S+ part=body drawings=30 spread=\S+ core\.source="quickdraw 2017"$/);
  assert.match(lines[1], / n=2 .* part=roof /);
  assert.ok(files['quickdraw-01.sop'].includes('# license: CC-BY-4.0'));
  assert.deepEqual(run().files, files);
  const w = new World({ library: library(scanWorlds()) });
  w.use('k.objects');
  assert.equal(w.tell(files['quickdraw-01.sop']).ok, true);
  assert.equal(w.query({ type: 'k.objects.skeleton', where: { of: 'house', n: 1 }, seek: 'part' }).value, 'body');
});
