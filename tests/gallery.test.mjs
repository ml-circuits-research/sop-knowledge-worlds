// docs/gallery.html and the list it shows (docs/worlds/k.objects/preview/objects.json, written by tools/render-svg.mjs):
// every object once, with a picture on disk, a source and a licence; and the page's search over that list.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, WORLDS_DIR, fullWorld } from '../tools/lib/worlds.mjs';
import { objectsOf } from '../tools/render-svg.mjs';

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
  assert.equal(hand.length, 60);
  assert.ok(hand.every((o) => o.license === 'CC0-1.0'));
  assert.equal(filterObjects(list, 'no such thing at all', '').length, 0);
  const one = cell(list.find((o) => o.name === 'house'));
  assert.ok(one.includes('src="worlds/k.objects/preview/house.svg"') && one.includes('hand-core 1') && one.includes('CC0-1.0'));
  assert.ok(readFileSync(join(REPO, 'docs/index.html'), 'utf8').includes('href="gallery.html"'));
});
