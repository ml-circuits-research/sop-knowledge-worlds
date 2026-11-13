// k.values (Round 8, item 3): colour names with RGB, scales, comparatives, shapes, directions, set words, numbers.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR, scanWorlds, fullWorld, schemaWorld } from '../tools/lib/worlds.mjs';
import { valueShards, CSS_RAW, BASIC, SCALES, numberWords } from '../tools/values-core.mjs';

const worlds = scanWorlds();
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const one = (w, k) => tok(w.attrs[k]?.[0]);
const world = fullWorld('k.values', worlds);
const of = (t) => world.ofType(`k.values.${t}`);

test('the shards are what tools/values-core.mjs gives (the CSS colours when the raw file is there)', () => {
  const files = valueShards();
  assert.equal(Object.keys(files).length, existsSync(CSS_RAW) ? 7 : 6);
  for (const [name, text] of Object.entries(files)) assert.equal(readFileSync(join(WORLDS_DIR, 'k.values', 'shards', name), 'utf8'), text, name);
});

test('colours: 141 CSS colours with an exact RGB value, common names with a usual one, never both; the basic colours are there', () => {
  const colours = of('colour');
  const css = colours.filter((c) => c.attrs.css);
  assert.equal(css.length, 141);
  for (const c of colours) {
    assert.ok(/^#[0-9A-F]{6}$/.test(one(c, 'rgb') ?? one(c, 'rgb_about')), c.id);
    assert.ok(!(c.attrs.rgb && c.attrs.rgb_about), c.id);
    assert.equal(one(c, 'core.source'), c.attrs.css ? 'css-colors 2.1.1' : 'hand-core 1', c.id);
    if (!c.attrs.css) assert.ok(c.attrs.rgb_about, c.id);
  }
  const byName = new Map(colours.map((c) => [one(c, 'name'), c]));
  for (const b of BASIC) assert.equal(one(byName.get(b), 'basic'), b, b);
  assert.equal(one(byName.get('red'), 'rgb'), '#FF0000');
  assert.equal(one(byName.get('dark olive green'), 'css'), 'darkolivegreen');
  assert.equal(one(byName.get('crimson'), 'named'), 'model');
  // The basic colours are the colour names of k.objects.part.colour.
  const { world: objects } = schemaWorld(worlds, 'k.objects');
  assert.deepEqual([...objects.schema('k.objects.part').keys.colour.enum].map(tok).sort(), [...BASIC].sort());
  const r = world.fork().tell('@x k.values.colour name=test rgb="#000000" rgb_about="#000000" core.source="test 1"');
  assert.equal(r.ok, false, 'both values are refused');
});

test('scales: ranks run from 1 to the number of steps; the size steps are the sizes of k.scenes; comparatives name a scale', () => {
  const steps = of('step'), scales = of('scale');
  assert.equal(scales.length, SCALES.length);
  for (const s of scales) {
    const ranks = steps.filter((x) => one(x, 'scale') === one(s, 'name')).map((x) => Number(one(x, 'rank'))).sort((a, b) => a - b);
    assert.deepEqual(ranks, Array.from({ length: Number(one(s, 'steps')) }, (_, i) => i + 1), s.id);
  }
  const size = steps.filter((x) => one(x, 'scale') === 'size').sort((a, b) => one(a, 'rank') - one(b, 'rank')).map((x) => one(x, 'name'));
  assert.deepEqual(size, ['tiny', 'small', 'medium', 'large', 'huge']);
  const { world: scenes } = schemaWorld(worlds, 'k.scenes');
  assert.deepEqual([...scenes.schema('k.scenes.thing').keys.size.enum].map(tok), size);
  const names = new Set(scales.map((s) => one(s, 'name')));
  for (const c of of('comparative')) assert.ok(names.has(one(c, 'scale')), c.id);
  const bigger = of('comparative').find((c) => one(c, 'text') === 'bigger');
  assert.equal(one(bigger, 'scale'), 'size'); assert.equal(one(bigger, 'way'), 'up');
});

test('directions have opposites that point back; numbers: one fact per word and kind, the values are right', () => {
  const dirs = new Map(of('direction').map((d) => [one(d, 'name'), d]));
  for (const [name, d] of dirs) {
    const o = dirs.get(one(d, 'opposite'));
    assert.equal(one(o, 'opposite'), name, name);
    if (d.attrs.x) { assert.equal(Number(one(o, 'x')), -Number(one(d, 'x')) || 0, name); assert.equal(Number(one(o, 'y')), -Number(one(d, 'y')) || 0, name); }
  }
  const nums = of('number');
  assert.equal(nums.length, numberWords().length);
  const value = (t, kind) => Number(one(nums.find((n) => one(n, 'text') === t && one(n, 'kind') === kind), 'value'));
  assert.equal(value('forty-two', 'cardinal'), 42); assert.equal(value('twelfth', 'ordinal'), 12); assert.equal(value('ninety-ninth', 'ordinal'), 99);
  assert.equal(value('dozen', 'group'), 12); assert.equal(value('twice', 'times'), 2); assert.equal(value('half', 'fraction'), 0.5);
  for (const w of [...of('colour'), ...of('step'), ...of('shape'), ...of('direction'), ...of('position'), ...of('set_word'), ...nums]) assert.ok(w.attrs['core.source'], w.id);
});

test('words reach their shard through the vocabulary index', () => {
  const vocab = JSON.parse(readFileSync(join(WORLDS_DIR, 'vocab.json'), 'utf8'));
  for (const [word, shard] of [['darkolivegreen', 'colours-css'], ['dark gray', 'colours-css'], ['mustard', 'colours-common'], ['big', 'scales'], ['bigger', 'scales'], ['round', 'shapes'],
    ['counterclockwise', 'directions'], ['upper left', 'directions'], ['every', 'sets'], ['the rest', 'sets'], ['seventeen', 'numbers'], ['third', 'numbers']]) assert.ok(vocab[word]?.includes(`k.values/shards/${shard}`), word);
});
