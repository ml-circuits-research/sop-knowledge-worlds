// tools/import/openmoji.mjs, mulberry.mjs and objects.mjs: made-up fixtures, and, when the raw files are present
// (git-ignored), that the shards on disk are what the importers give.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { REPO, WORLDS_DIR } from '../tools/lib/worlds.mjs';
import { importOpenmoji, PREFIX as OM } from '../tools/import/openmoji.mjs';
import { importMulberry, PREFIX as MB } from '../tools/import/mulberry.mjs';
import { takenNames, detailByRule } from '../tools/import/objects.mjs';

const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="20" width="60" height="30" fill="#DC1E1E"/><path fill="#000" d="M0 0H100V100H0Z M5 5H95V95H5Z"/></svg>';
const dir = join(WORLDS_DIR, 'k.objects', 'shards');

test('openmoji: things with a new name become objects; outlines are closed lines', () => {
  const data = [
    { hexcode: 'E000', group: 'extras-openmoji', subgroups: 'animals-nature', annotation: 'goldfish', tags: '', openmoji_tags: 'fish, water', skintone: '' },
    { hexcode: '1F436', group: 'animals-nature', subgroups: 'animal-mammal', annotation: 'dog face', tags: 'dog, pet', openmoji_tags: '', skintone: '' },
    { hexcode: 'E001', group: 'extras-openmoji', subgroups: 'emergency', annotation: 'evacuate', tags: '', openmoji_tags: '', skintone: '' },
    { hexcode: 'E002', group: 'extras-openmoji', subgroups: 'healthcare', annotation: 'female doctor', tags: '', openmoji_tags: '', skintone: '' },
    { hexcode: '1F600', group: 'smileys-emotion', subgroups: 'face-smiling', annotation: 'grinning face', tags: '', openmoji_tags: '', skintone: '' },
  ];
  const run = () => importOpenmoji({ data, svg: () => svg, taken: new Set(['dog face']), partNames: 'goldfish\t1\tbody\t\n' });
  const { files, stats } = run();
  assert.deepEqual(Object.keys(files), ['openmoji-animals-nature-01.sop']);
  assert.deepEqual(stats.skipped, { notThing: 1, taken: 1, noSvg: 0 });
  assert.deepEqual(files['openmoji-animals-nature-01.sop'].split('\n').filter((l) => l.startsWith('@')), [
    '@k.objects.ome000 k.objects.object name=goldfish core.source="openmoji 3e01de5"',
    '@k.objects.ome000.p1 k.objects.part of=goldfish name=body named=model shape=rectangle x=10 y=20 w=60 h=30 z=1 colour=red rgb="#DC1E1E" core.source="openmoji 3e01de5"',
    '@k.objects.ome000.p2 k.objects.part of=goldfish name=part2 kind=detail shape=line x=0 y=0 w=100 h=100 z=2 colour=black rgb="#000000" core.source="openmoji 3e01de5"',
    '@k.objects.ome000.p2.1 k.objects.point part=$k.objects.ome000.p2 n=1 x=0 y=0 core.source="openmoji 3e01de5"',
    '@k.objects.ome000.p2.2 k.objects.point part=$k.objects.ome000.p2 n=2 x=100 y=0 core.source="openmoji 3e01de5"',
    '@k.objects.ome000.p2.3 k.objects.point part=$k.objects.ome000.p2 n=3 x=100 y=100 core.source="openmoji 3e01de5"',
    '@k.objects.ome000.p2.4 k.objects.point part=$k.objects.ome000.p2 n=4 x=0 y=100 core.source="openmoji 3e01de5"',
    '@k.objects.ome000.p2.5 k.objects.point part=$k.objects.ome000.p2 n=5 x=0 y=0 core.source="openmoji 3e01de5"',
    '@k.objects.ome000.word core.word text=fish text=water means=goldfish of=k.objects.object.name core.source="openmoji 3e01de5"',
  ]);
  assert.ok(files['openmoji-animals-nature-01.sop'].includes('# license: CC-BY-SA-4.0'));
  assert.deepEqual(run().files, files);
});

test('mulberry: nouns of thing categories, first drawing only, new names only', () => {
  const info = '﻿symbol-id,category-id,grammar,rated,tags,symbol-en,category-en,symbol-fr,category-fr\n'
    + '10,2,Noun,0,seat chair,arm_chair,Building Furniture,x,y\n11,2,Noun,0,seat,arm_chair_2,Building Furniture,x,y\n'
    + '12,3,Verb,0,act,"blow_,_to",Verb,x,y\n13,4,Noun,0,pet,dog,Animal Mammal,x,y\n14,5,Noun,0,job,baker_1a,People Profession,x,y\n';
  const { files, stats } = importMulberry({ info, svg: () => svg, taken: new Set(['dog']) });
  assert.deepEqual(Object.keys(files), ['mulberry-building-furniture-01.sop']);
  assert.deepEqual(stats.skipped, { notThing: 2, variant: 1, taken: 1, noSvg: 0, excluded: 0 });
  const lines = files['mulberry-building-furniture-01.sop'].split('\n').filter((l) => l.startsWith('@'));
  assert.equal(lines[0], '@k.objects.mb10 k.objects.object name="arm chair" core.source="mulberry fa94a93"');
  assert.equal(lines.at(-1), '@k.objects.mb10.word core.word text=seat text=chair means="arm chair" of=k.objects.object.name core.source="mulberry fa94a93"');
  // sources/mulberry/excluded.tsv: a name with a reason is skipped.
  const without = importMulberry({ info, svg: () => svg, taken: new Set(['dog']), excluded: '# name\treason\narm chair\tnot a thing\n' });
  assert.deepEqual(Object.keys(without.files), []);
  assert.equal(without.stats.skipped.excluded, 1);
});

test('details by rule: strokes, and a black shape with the box of a filled shape; a row of the names file wins', () => {
  const parts = [{ shape: 'polygon', colour: 'black', x: 10, y: 10, w: 50, h: 40 }, { shape: 'polygon', colour: 'red', x: 11, y: 11, w: 48, h: 38 },
    { shape: 'line', colour: 'red', x: 0, y: 0, w: 5, h: 5 }, { shape: 'circle', colour: 'black', x: 70, y: 70, w: 5, h: 5 }];
  assert.deepEqual(detailByRule(parts), [true, false, true, false]);
  const data = [{ hexcode: 'E000', group: 'extras-openmoji', subgroups: 'animals-nature', annotation: 'goldfish', tags: '', openmoji_tags: '', skintone: '' }];
  const lines = importOpenmoji({ data, svg: () => svg, partNames: 'goldfish\t2\tframe\t\n' }).files['openmoji-animals-nature-01.sop'].split('\n');
  assert.ok(lines.some((l) => l.includes('name=frame named=model shape=line')));
});

test('a name belongs to the first source that has it: hand-written, noto, openmoji, mulberry', () => {
  const d = mkdtempSync(join(tmpdir(), 'skw-obj-'));
  try {
    writeFileSync(join(d, 'animals.sop'), '@a k.objects.object name=Cat core.source="x 1"\n');
    writeFileSync(join(d, 'noto-a-01.sop'), '@b k.objects.object name="dog face" core.source="x 1"\n');
    writeFileSync(join(d, 'openmoji-a-01.sop'), '@c k.objects.object name=goldfish core.source="x 1"\n');
    writeFileSync(join(d, 'mulberry-a-01.sop'), '@d k.objects.object name=kettle core.source="x 1"\n');
    assert.deepEqual([...takenNames(d, 'noto-')], ['cat']);
    assert.deepEqual([...takenNames(d, 'openmoji-')].sort(), ['cat', 'dog face']);
    assert.deepEqual([...takenNames(d, 'mulberry-')].sort(), ['cat', 'dog face', 'goldfish']);
  } finally { rmSync(d, { recursive: true }); }
});

const same = (prefix, files) => {
  assert.deepEqual(readdirSync(dir).filter((f) => f.startsWith(prefix)).sort(), Object.keys(files).sort());
  for (const [name, text] of Object.entries(files)) assert.equal(readFileSync(join(dir, name), 'utf8'), text, name);
};
const om = join(REPO, 'sources/openmoji/raw/repo');
test('the openmoji shards on disk are what the importer gives', { skip: !existsSync(join(om, 'data/openmoji.json')) && 'raw files not downloaded' }, () => {
  same(OM, importOpenmoji({
    data: JSON.parse(readFileSync(join(om, 'data/openmoji.json'), 'utf8')),
    svg: (hex) => { const p = join(om, 'color/svg', `${hex}.svg`); return existsSync(p) ? readFileSync(p, 'utf8') : null; },
    partNames: readFileSync(join(REPO, 'sources/openmoji/part-names.tsv'), 'utf8'), taken: takenNames(dir, OM),
  }).files);
});
const mb = join(REPO, 'sources/mulberry/raw/repo');
test('the mulberry shards on disk are what the importer gives', { skip: !existsSync(join(mb, 'scripts/data/symbol-info.csv')) && 'raw files not downloaded' }, () => {
  same(MB, importMulberry({
    info: readFileSync(join(mb, 'scripts/data/symbol-info.csv'), 'utf8'),
    svg: (file) => { const p = join(mb, 'EN', `${file}.svg`); return existsSync(p) ? readFileSync(p, 'utf8') : null; },
    partNames: readFileSync(join(REPO, 'sources/mulberry/part-names.tsv'), 'utf8'), taken: takenNames(dir, MB),
    excluded: readFileSync(join(REPO, 'sources/mulberry/excluded.tsv'), 'utf8'),
  }).files);
});
