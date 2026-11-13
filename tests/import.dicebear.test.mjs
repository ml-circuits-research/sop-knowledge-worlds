// tools/import/dicebear.mjs on a made-up style definition, and, when the raw definitions are present (git-ignored),
// that the shards on disk are what the importer gives.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, WORLDS_DIR } from '../tools/lib/worlds.mjs';
import { convertStyle, importDicebear, readFeatures, STYLES } from '../tools/import/dicebear.mjs';

const color = (name) => ({ type: 'color', name });
const def = {
  meta: { license: { name: 'CC0 1.0', url: 'u', text: 'a made-up style' } },
  canvas: { width: 100, height: 100, elements: [{ name: 'head', type: 'component', attributes: { transform: 'translate(10 10)' } }, { name: 'hat', type: 'component', attributes: { transform: 'translate(0 0)' } }] },
  attributes: {},
  components: {
    head: { width: 80, height: 80, variants: { round: { elements: [
      { name: 'rect', type: 'element', attributes: { x: '0', y: '0', width: '80', height: '80', fill: color('skin') } },
      { name: 'eyes', type: 'component', attributes: { transform: 'translate(20 20)' } },
    ] } } },
    eyes: { width: 40, height: 10, variants: {
      dots: { elements: [{ name: 'circle', type: 'element', attributes: { cx: '5', cy: '5', r: '5', fill: '#000000' } }, { name: 'circle', type: 'element', attributes: { cx: '35', cy: '5', r: '5', fill: '#000000' } }], tags: [] },
      nothing: { elements: [] },
    } },
    hat: { width: 100, height: 100, probability: 20, variants: {
      band: { elements: [{ name: 'rect', type: 'element', attributes: { x: '10', y: '2', width: '80', height: '8', fill: color('hair') } }], tags: ['hairLength:short'] },
      veil: { elements: [{ name: 'rect', type: 'element', attributes: { x: '0', y: '0', width: '100', height: '100', fill: '#112233' } }] },
    } },
  },
  colors: { skin: { values: ['#f0c0a0'] }, hair: { values: ['#402010'] } },
};

test('a style: components become slots in drawing order, variants are placed, list colours become tints', () => {
  const { slots, variants, stats } = convertStyle('toy', def);
  assert.deepEqual(slots.map((s) => [s.name, s.x, s.y, s.w, s.h, s.z, s.optional]), [['head', 10, 10, 80, 80, 0, false], ['eyes', 30, 30, 40, 10, 1, false], ['hat', 10, 2, 80, 8, 2, true]]);
  assert.deepEqual(variants.map((v) => `${v.slot}: ${v.name}`), ['head: toy round', 'eyes: toy dots', 'hat: toy band']);
  assert.deepEqual(variants[0].parts, [{ shape: 'square', x: 10, y: 10, w: 80, h: 80, rgb: '#F0C0A0', colour: variants[0].parts[0].colour, tint: 'skin' }]);
  assert.deepEqual(variants[1].parts.map((p) => [p.shape, p.x, p.y, p.w, p.tint]), [['circle', 30, 30, 10, undefined], ['circle', 60, 30, 10, undefined]]);
  assert.equal(variants[2].parts[0].tint, 'hair');
  // "nothing" has no parts; "veil" would cover the face.
  assert.deepEqual({ empty: stats.empty, covering: stats.covering, variants: stats.variants }, { empty: 1, covering: 1, variants: 3 });
});

test('the shards: slots, variants with features from the table and length from the tags; another licence stops the import', () => {
  const features = '# style\tslot\tvariant\ntoy\teyes\tdots\tsize=small\tkind=dot\n';
  assert.deepEqual([...readFeatures(features)], [['toy\teyes\tdots', [['size', 'small'], ['kind', 'dot']]]]);
  STYLES.toy = 'CC0 1.0';
  try {
    const run = () => importDicebear({ definitions: { toy: def }, features, styles: ['toy'] });
    const { files, stats } = run();
    assert.deepEqual(files, run().files, 'deterministic');
    assert.deepEqual(Object.keys(files), ['toy-slots.sop', 'toy-head.sop', 'toy-eyes.sop', 'toy-hat.sop']);
    assert.ok(files['toy-eyes.sop'].includes('# license: CC0-1.0'));
    assert.deepEqual(files['toy-eyes.sop'].split('\n').filter((l) => l.startsWith('@')).slice(0, 2), [
      '@k.faces.toy.eyes.dots k.faces.variant slot=eyes name="toy dots" style=toy size=small kind=dot named=model core.source="dicebear-toy 67f54a0"',
      '@k.faces.toy.eyes.dots.p1 k.faces.part slot=eyes of="toy dots" name=part1 shape=circle x=30 y=30 w=10 h=10 z=1 colour=black rgb="#000000" core.source="dicebear-toy 67f54a0"',
    ]);
    assert.ok(files['toy-hat.sop'].includes('k.faces.variant slot=hat name="toy band" style=toy length=short core.source='));
    assert.ok(files['toy-slots.sop'].includes('@k.faces.toy.slot.hat k.faces.slot style=toy name=hat x=10 y=2 w=80 h=8 z=2 optional=true core.source="dicebear-toy 67f54a0"'));
    assert.equal(stats.toy.license, 'CC0-1.0');
    assert.throws(() => importDicebear({ definitions: { toy: { ...def, meta: { license: { name: 'All rights reserved', text: '' } } } }, styles: ['toy'] }), /expected/);
  } finally { delete STYLES.toy; }
});

const raw = join(REPO, 'sources/dicebear/raw/styles/src');
test('the DiceBear shards on disk are what the importer gives', { skip: !existsSync(raw) && 'raw files not downloaded' }, () => {
  const definitions = Object.fromEntries(Object.keys(STYLES).map((s) => [s, JSON.parse(readFileSync(join(raw, `${s}.json`), 'utf8'))]));
  const { files, stats } = importDicebear({ definitions, features: readFileSync(join(REPO, 'sources/dicebear/features.tsv'), 'utf8') });
  const dir = join(WORLDS_DIR, 'k.faces', 'shards');
  const onDisk = readdirSync(dir).filter((f) => Object.keys(STYLES).some((s) => f.startsWith(`${s}-`)));
  assert.deepEqual(onDisk.sort(), Object.keys(files).sort());
  for (const [name, text] of Object.entries(files)) assert.equal(readFileSync(join(dir, name), 'utf8'), text, name);
  assert.equal(Object.values(stats).reduce((n, s) => n + s.variants, 0), 347);
  // Every row of the features table names a variant that exists.
  const named = Object.values(files).join('\n').split('\n').filter((l) => l.includes(' k.faces.variant ') && l.includes(' named=model ')).length;
  assert.equal(named, readFeatures(readFileSync(join(REPO, 'sources/dicebear/features.tsv'), 'utf8')).size);
});
