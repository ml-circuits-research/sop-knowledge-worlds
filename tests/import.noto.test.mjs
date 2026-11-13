// tools/import/svg-parts.mjs and noto-emoji.mjs: a small SVG and emoji list made up for the test, and, when the raw
// files are present (git-ignored), that the noto shards on disk are what the importer gives.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, WORLDS_DIR } from '../tools/lib/worlds.mjs';
import { svgToParts, flattenPath, simplify, colourName } from '../tools/import/svg-parts.mjs';
import { importNoto, readEmojiList, readPartNames, PREFIX } from '../tools/import/noto-emoji.mjs';
import { takenNames } from '../tools/import/objects.mjs';

const svg = `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <defs><linearGradient id="g"><stop offset="0" stop-color="#ff0000"/><stop offset="1" style="stop-color:#00ff00"/></linearGradient>
    <clipPath id="c"><rect x="0" y="0" width="5" height="5"/></clipPath></defs>
  <rect x="20" y="100" width="160" height="80" fill="#8C552D"/>
  <path style="fill:#DC1E1E" d="M20,100 L100,20 L180,100 Z M90,70 h20 v20 h-20 z"/>
  <g transform="translate(100 0)"><circle cx="0" cy="140" r="20" fill="url(#g)"/></g>
  <ellipse cx="50" cy="140" rx="20" ry="10" style="fill:#FFFFFF;opacity:0.3"/>
  <polyline points="20,190 100,196 180,190" fill="none" stroke="#000"/>
  <path fill="#2870DC" d="M190 190h1v1h-1z"/>
</svg>`;

test('an SVG becomes parts: primitives stay, paths become polygons, holes and overlays go', () => {
  const parts = svgToParts(svg);
  assert.deepEqual(parts.map((p) => [p.shape, p.x, p.y, p.w, p.h, p.colour, p.rgb]), [
    ['rectangle', 10, 50, 80, 40, 'brown', '#8C552D'],
    ['polygon', 10, 10, 80, 40, 'red', '#DC1E1E'],
    ['circle', 40, 60, 20, 20, 'red', '#FF0000'],
    ['line', 10, 95, 80, 3, 'black', '#000000'],
  ]);
  assert.deepEqual(parts[1].points, [[10, 50], [50, 10], [90, 50]]);
  assert.deepEqual(svgToParts(svg), parts);
});

test('path flattening, simplifying and colour names', () => {
  const [sub] = flattenPath('M0 0 C0 10 10 10 10 0 a5 5 0 1 0 10 0 z');
  assert.equal(sub.closed, true);
  assert.ok(sub.points.length > 15);
  assert.deepEqual(sub.points[10], [10, 0]);
  assert.deepEqual(simplify([[0, 0], [5, 0.1], [10, 0], [10, 10], [0, 10]], 0.5, true), [[0, 0], [10, 0], [10, 10], [0, 10]]);
  assert.equal(colourName([210, 120, 86]), 'brown');
  assert.equal(colourName([250, 250, 250]), 'white');
  assert.equal(colourName([60, 60, 60]), 'black');
  assert.equal(colourName([66, 165, 245]), 'blue');
});

const list = `# group: Smileys & Emotion\n# subgroup: face-smiling\n1F600 ; fully-qualified # 😀 E1.0 grinning face
# group: Travel & Places\n# subgroup: place-building\n1F3E0 ; fully-qualified # 🏠 E0.6 house\n1F3E1 ; fully-qualified # 🏡 E0.6 house with garden
# subgroup: time\n1F550 ; fully-qualified # 🕐 E0.6 one o’clock\n`;
const annotations = { annotations: { annotations: {
  '😀': { default: ['face'], tts: ['grinning face'] }, '🏠': { default: ['building', 'home'], tts: ['house'] },
  '🏡': { default: ['garden', 'home'], tts: ['house with garden'] }, '🕐': { default: ['1'], tts: ['one o’clock'] },
} } };

test('the importer keeps things, leaves hand-written names alone, and names parts from the TSV', () => {
  assert.deepEqual(readEmojiList(list).map((e) => e.code), ['1f3e0', '1f3e1', '1f550']);
  assert.deepEqual([...readPartNames('# c\nhouse with garden\t2\troof\t\nhouse with garden\t4\t\tdetail\n').get('house with garden')], [[2, { name: 'roof', kind: undefined }], [4, { name: undefined, kind: 'detail' }]]);
  const run = () => importNoto({ list, annotations, svg: () => svg, partNames: 'house with garden\t2\troof\t\nhouse with garden\t4\t\tdetail\n', taken: new Set(['house']) });
  const { files, stats } = run();
  assert.deepEqual(Object.keys(files), ['noto-place-building-01.sop']);
  assert.deepEqual(stats.skipped, { notThing: 1, noName: 0, noSvg: 0, noParts: 0, handWritten: ['house'] });
  assert.deepEqual([stats.objects, stats.parts, stats.points, stats.named], [1, 4, 6, 1]);
  const lines = files['noto-place-building-01.sop'].split('\n').filter((l) => l.startsWith('@'));
  assert.deepEqual(lines.slice(0, 4), [
    '@k.objects.u1f3e1 k.objects.object name="house with garden" core.source="noto-emoji 99701e0" core.source="cldr 48"',
    '@k.objects.u1f3e1.p1 k.objects.part of="house with garden" name=part1 shape=rectangle x=10 y=50 w=80 h=40 z=1 colour=brown rgb="#8C552D" core.source="noto-emoji 99701e0"',
    '@k.objects.u1f3e1.p2 k.objects.part of="house with garden" name=roof named=model shape=polygon x=10 y=10 w=80 h=40 z=2 colour=red rgb="#DC1E1E" core.source="noto-emoji 99701e0"',
    '@k.objects.u1f3e1.p2.1 k.objects.point part=$k.objects.u1f3e1.p2 n=1 x=10 y=50 core.source="noto-emoji 99701e0"',
  ]);
  assert.ok(lines.includes('@k.objects.u1f3e1.p4 k.objects.part of="house with garden" name=part4 kind=detail shape=line x=10 y=95 w=80 h=3 z=4 colour=black rgb="#000000" core.source="noto-emoji 99701e0"'));
  assert.equal(lines.at(-1), '@k.objects.u1f3e1.word core.word text=garden text=home means="house with garden" of=k.objects.object.name core.source="cldr 48"');
  assert.deepEqual(run().files, files);
});

const svgDir = join(REPO, 'sources/noto-emoji/raw/repo/2D/svg');
const cldr = join(REPO, 'sources/cldr/raw');
test('the noto shards on disk are what the importer gives from the raw files', { skip: !(existsSync(svgDir) && existsSync(join(cldr, 'emoji-test.txt'))) && 'raw files not downloaded' }, () => {
  const dir = join(WORLDS_DIR, 'k.objects', 'shards');
  const taken = takenNames(dir, PREFIX);
  const limit = Number(readFileSync(join(REPO, 'sources/noto-emoji/limit.txt'), 'utf8').trim());
  const { files } = importNoto({
    list: readFileSync(join(cldr, 'emoji-test.txt'), 'utf8'),
    annotations: JSON.parse(readFileSync(join(cldr, 'annotations.json'), 'utf8')),
    svg: (code) => { const p = join(svgDir, `emoji_u${code}.svg`); return existsSync(p) ? readFileSync(p, 'latin1') : null; },
    partNames: readFileSync(join(REPO, 'sources/noto-emoji/part-names.tsv'), 'utf8'),
    taken,
  }, { limit });
  assert.deepEqual(readdirSync(dir).filter((f) => f.startsWith(PREFIX)).sort(), Object.keys(files).sort());
  for (const [name, text] of Object.entries(files)) assert.equal(readFileSync(join(dir, name), 'utf8'), text, name);
});
