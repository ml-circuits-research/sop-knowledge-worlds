// docs/gallery.html and the list it shows (docs/worlds/k.objects/preview/objects.json, written by tools/render-svg.mjs):
// every object once, with a picture on disk, a source and a licence; and the page's search over that list.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, WORLDS_DIR, fullWorld } from '../tools/lib/worlds.mjs';
import { objectsOf, fileOf } from '../tools/render-svg.mjs';

const preview = join(WORLDS_DIR, 'k.objects', 'preview');
const list = JSON.parse(readFileSync(join(preview, 'objects.json'), 'utf8'));
const html = readFileSync(join(REPO, 'docs/gallery.html'), 'utf8');
const LICENSES = new Set(['CC0-1.0', 'Apache-2.0 AND Unicode-3.0', 'CC-BY-SA-4.0']);

test('objects.json lists every object of k.objects once, with its picture, source and licence', () => {
  assert.deepEqual(list.map((o) => o.name), objectsOf(fullWorld('k.objects')));
  assert.equal(new Set(list.map((o) => o.file)).size, list.length);
  for (const o of list) {
    assert.ok(existsSync(join(preview, o.file)), `${o.name}: ${o.file}`);
    assert.match(o.shard, /^k\.objects\/shards\//, o.name);
    assert.match(o.source, /^(hand-core|noto-emoji|openmoji|mulberry) /, o.name);
    assert.ok(LICENSES.has(o.license), `${o.name}: ${o.license}`);
    assert.ok(o.parts > 0 && o.named >= 0 && o.named <= o.parts, o.name);
  }
});

test('the gallery page loads that list, shows lazy images, and its search finds objects by name and source', () => {
  assert.ok(html.includes("'worlds/k.objects/preview/objects.json'"));
  assert.ok(html.includes('loading="lazy"') && html.includes('type="search"'));
  const script = /<script>([\s\S]*?)<\/script>/.exec(html)[1];
  const { filterObjects, cell } = new Function(`${script}\nreturn { filterObjects, cell };`)();
  assert.deepEqual(filterObjects(list, 'HOUSE', '').map((o) => o.name).filter((n) => n === 'house' || n === 'lighthouse'), ['house', 'lighthouse']);
  assert.deepEqual(filterObjects(list, 'dog face', '').map((o) => o.name), ['dog face']);
  const hand = filterObjects(list, '', 'hand-core 1');
  assert.equal(hand.length, 328);
  assert.ok(hand.every((o) => o.license === 'CC0-1.0'));
  assert.equal(filterObjects(list, 'no such thing at all', '').length, 0);
  const one = cell(list.find((o) => o.name === 'house'));
  assert.ok(one.includes('src="worlds/k.objects/preview/house.svg"') && one.includes('hand-core 1') && one.includes('CC0-1.0'));
  assert.ok(readFileSync(join(REPO, 'docs/index.html'), 'utf8').includes('href="gallery.html"'));
});

// Reviewer block "02:45": "crane bird" did not render on a sheet because its preview is crane_bird.svg. One rule finds
// the picture of a name, said in k.objects/WORLD.md; the line there, fileOf, objects.json and the gallery agree.
test('one rule gives the picture of every object and scene, from the name or from its quoted token', () => {
  const doc = readFileSync(join(WORLDS_DIR, 'k.objects', 'WORLD.md'), 'utf8');
  const line = /^ {4}const fileOf = (.+);$/m.exec(doc)[1];
  const documented = new Function(`return ${line};`)();
  const seen = new Map();
  for (const o of list) {
    const quoted = /[^A-Za-z0-9_-]/.test(o.name) ? JSON.stringify(o.name) : o.name;
    assert.equal(o.file, `${fileOf(o.name)}.svg`, o.name);
    assert.equal(`${documented(o.name)}.svg`, o.file, `${o.name}: the rule of WORLD.md`);
    assert.equal(`${fileOf(quoted)}.svg`, o.file, `${quoted}: the token gives the same file`);
    const key = o.file.toLowerCase();
    assert.ok(!seen.has(key), `${o.name} and ${seen.get(key)} share ${o.file}`);
    seen.set(key, o.name);
  }
  for (const [name, file] of [['crane bird', 'crane_bird.svg'], ['"crane bird"', 'crane_bird.svg'], ['woman’s hat', 'woman_s_hat.svg'], ['piñata', 'pi_ata.svg']]) {
    assert.equal(`${fileOf(name)}.svg`, file);
    assert.ok(existsSync(join(preview, file)), file);
  }
  const script = /<script>([\s\S]*?)<\/script>/.exec(html)[1];
  const { cell } = new Function(`${script}\nreturn { cell };`)();
  assert.ok(cell(list.find((o) => o.name === 'crane bird')).includes('src="worlds/k.objects/preview/crane_bird.svg"'));
  const scenes = fullWorld('k.scenes').ofType('k.scenes.scene').map((s) => s.attrs.name[0]);
  for (const s of scenes) assert.ok(existsSync(join(WORLDS_DIR, 'k.scenes', 'preview', `${fileOf(s)}.svg`)), s);
});

// docs/faces.html and the list it shows (docs/worlds/k.faces/preview/faces.json, written by tools/render-faces.mjs).
test('the faces page loads faces.json and filters the variants by style, slot, name and features', () => {
  const dir = join(WORLDS_DIR, 'k.faces', 'preview');
  const faces = JSON.parse(readFileSync(join(dir, 'faces.json'), 'utf8'));
  const page = readFileSync(join(REPO, 'docs/faces.html'), 'utf8');
  assert.ok(page.includes("'worlds/k.faces/preview/faces.json'") && page.includes('loading="lazy"') && page.includes('type="search"'));
  for (const x of [...faces.variants, ...faces.presets, ...faces.expressions, ...faces.random]) assert.ok(existsSync(join(dir, x.file)), x.file);
  for (const v of faces.variants) { assert.ok(v.style && v.slot && v.name && v.source, v.file); assert.ok(['CC0-1.0', 'CC-BY-4.0'].includes(v.license), `${v.name}: ${v.license}`); }
  const script = /<script>([\s\S]*?)<\/script>/.exec(page)[1];
  const { filterVariants, facesOf, cell, featureText } = new Function(`${script}\nreturn { filterVariants, facesOf, cell, featureText };`)();
  assert.deepEqual(filterVariants(faces.variants, 'curly', 'plain', 'hair_back').map((v) => v.name), ['afro', 'long curly']);
  assert.deepEqual(filterVariants(faces.variants, 'top hat', '', '').map((v) => v.name), ['top hat']);
  assert.equal(filterVariants(faces.variants, '', 'cutouts', '').length, 38);
  assert.ok(filterVariants(faces.variants, '', '', 'mouth').length > 40);
  const afro = faces.variants.find((v) => v.style === 'plain' && v.name === 'afro');
  assert.equal(featureText(afro), 'size large, feel curly, kind afro');
  const one = cell(afro);
  assert.ok(one.includes('src="worlds/k.faces/preview/variant-plain-hair_back-afro.svg"') && one.includes('hair_back') && one.includes('hand-core 1') && one.includes('CC0-1.0'));
  assert.ok(cell(faces.variants.find((v) => v.name === 'personas walrus')).includes('named by a model'));
  assert.equal(facesOf(faces, 'plain').length, 14 + 7 + 40);
  assert.equal(facesOf(faces, 'micah').length, 12);
  assert.ok(html.includes('href="faces.html"') && readFileSync(join(REPO, 'docs/index.html'), 'utf8').includes('href="faces.html"'));
});
