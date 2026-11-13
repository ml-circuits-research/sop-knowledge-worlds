// k.scenes (Round 7): the usual place and relative size of drawable things, and the scenes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, WORLDS_DIR, scanWorlds, fullWorld } from '../tools/lib/worlds.mjs';
import { readPlaceSize, thingShards, letterOf } from '../tools/scenes-core.mjs';

const worlds = scanWorlds();
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const scenes = fullWorld('k.scenes', worlds);
const objectsWorld = fullWorld('k.objects', worlds);
const objects = new Set(objectsWorld.ofType('k.objects.object').map((w) => tok(w.attrs.name[0])));
const standIns = new Set(objectsWorld.ofType('k.objects.stand_in').map((w) => tok(w.attrs.name[0])));
const things = scenes.ofType('k.scenes.thing');

test('the things shards are what tools/scenes-core.mjs gives from place-size.tsv', () => {
  const files = thingShards(readPlaceSize(readFileSync(join(REPO, 'sources/hand-core/place-size.tsv'), 'utf8')));
  const dir = join(WORLDS_DIR, 'k.scenes', 'shards');
  assert.deepEqual(readdirSync(dir).filter((f) => f.startsWith('things-')).sort(), Object.keys(files).sort());
  for (const [name, text] of Object.entries(files)) assert.equal(readFileSync(join(dir, name), 'utf8'), text, name);
  assert.equal(letterOf('1st place medal'), '0');
  assert.equal(letterOf('Earth'), 'e');
  assert.throws(() => readPlaceSize('hat\ton_thing\t\tsmall\n'), /on what/);
  assert.throws(() => readPlaceSize('hat\tupstairs\t\tsmall\n'), /place/);
});

test('every thing with a usual place or size is a k.objects object or stand-in; nearly every object has one', () => {
  for (const w of things) {
    const name = tok(w.attrs.name[0]);
    assert.ok(objects.has(name) || standIns.has(name), `${name} is neither an object nor a stand-in of k.objects`);
    assert.deepEqual(w.attrs.named, ['model'], name);
    assert.deepEqual(w.attrs['core.source'], ['"hand-core 1"'], name);
    assert.ok(w.attrs.place || w.attrs.size, name);
  }
  const named = new Set(things.map((w) => tok(w.attrs.name[0])));
  const without = [...objects].filter((o) => !named.has(o));
  assert.ok(things.length >= 2000, `${things.length} things`);
  assert.ok(without.length <= objects.size * 0.05, `${without.length} objects without a place or size`);
});

test('a thing that is on another thing says on which', () => {
  for (const w of things) if (w.attrs.place?.[0] === 'on_thing') assert.ok(w.attrs.on?.length, tok(w.attrs.name[0]));
  const w = scenes.fork();
  assert.equal(w.tell('@a1 k.scenes.thing name=bonnet place=on_thing size=small', { ns: 'app' }).ok, false);
  assert.equal(w.tell('@a2 k.scenes.thing name=bonnet place=on_thing on=head size=small', { ns: 'app' }).ok, true);
});

test('the audit of the labels: 200 rows, the wrong ones are corrected in the table', () => {
  const rows = readFileSync(join(REPO, 'sources/hand-core/place-size-audit.tsv'), 'utf8').split('\n').filter((l) => l.trim() && !l.startsWith('#')).map((l) => l.split('\t'));
  assert.equal(rows.length, 200);
  const table = new Map(readPlaceSize(readFileSync(join(REPO, 'sources/hand-core/place-size.tsv'), 'utf8')).map((r) => [r.name, r]));
  for (const [, name, place, on, size, verdict, note] of rows) {
    assert.ok(['right', 'wrong', 'unclear'].includes(verdict), name);
    const now = table.get(name);
    assert.ok(now, name);
    if (verdict === 'wrong') { assert.ok(note, name); assert.notDeepEqual([now.place, now.on, now.size], [place, on, size], `${name} is still as it was`); }
    if (verdict === 'right') assert.deepEqual([now.place, now.on, now.size], [place, on, size], name);
  }
  assert.ok(rows.filter((r) => r[5] === 'wrong').length <= 20);
});

// ---- R7.1: the scenes
import { existsSync } from 'node:fs';
import { sceneShards, sceneWires, SCENES } from '../tools/scenes-data.mjs';
import { readScenes, layout, renderScene, W as WIDTH, H as HEIGHT } from '../tools/render-scenes.mjs';
import { fileOf } from '../tools/render-svg.mjs';

const sceneFacts = scenes.ofType('k.scenes.scene');
const has = scenes.ofType('k.scenes.has');

test('the scene shards are what tools/scenes-data.mjs gives; at least 60 scenes', () => {
  const files = sceneShards(objects);
  const dir = join(WORLDS_DIR, 'k.scenes', 'shards');
  assert.deepEqual(readdirSync(dir).filter((f) => f.startsWith('scenes-')).sort(), Object.keys(files).sort());
  for (const [name, text] of Object.entries(files)) assert.equal(readFileSync(join(dir, name), 'utf8'), text, name);
  assert.ok(sceneFacts.length >= 60, `${sceneFacts.length} scenes`);
  assert.equal(sceneFacts.length, SCENES.length);
  for (const name of ['beach', 'farm', 'city street', 'forest', 'kitchen', 'classroom', 'playground', 'space', 'underwater', 'winter']) assert.ok(sceneFacts.some((w) => tok(w.attrs.name[0]) === name), name);
});

test('what a scene has: the scene exists, a drawing is an object, what a thing is on is in the same scene', () => {
  const names = new Set(sceneFacts.map((w) => tok(w.attrs.name[0])));
  const inScene = new Map();
  for (const w of has) { const s = tok(w.attrs.scene[0]); if (!inScene.has(s)) inScene.set(s, new Set()); inScene.get(s).add(tok(w.attrs.thing[0])); }
  const kind = new Map(sceneFacts.map((w) => [tok(w.attrs.name[0]), tok(w.attrs.kind[0])]));
  const ground = new Map(sceneFacts.map((w) => [tok(w.attrs.name[0]), tok(w.attrs.ground?.[0])]));
  for (const w of has) {
    const s = tok(w.attrs.scene[0]);
    assert.ok(names.has(s), w.id);
    for (const d of w.attrs.drawing ?? []) assert.ok(objects.has(tok(d)), `${w.id}: drawing ${d}`);
    for (const o of w.attrs.on ?? []) assert.ok(inScene.get(s).has(tok(o)), `${w.id}: on ${o}`);
    assert.deepEqual(w.attrs['core.source'], ['"hand-core 1"'], w.id);
    // A thing on the water of a scene that is not all water says on which water.
    if (w.attrs.where[0] === 'water' && kind.get(s) !== 'underwater' && ground.get(s) !== 'water') assert.ok(w.attrs.on, `${w.id}: on which water?`);
  }
  for (const w of sceneFacts) {
    const n = inScene.get(tok(w.attrs.name[0]))?.size ?? 0;
    assert.ok(n >= 10, `${w.id}: ${n} things`);
    for (const d of w.attrs.drawing ?? []) assert.ok(objects.has(tok(d)), `${w.id}: drawing ${d}`);
    assert.ok(w.attrs.happens?.length >= 2, `${w.id}: what happens there`);
  }
});

test('in every scene at least three quarters of the things have a drawing; over all scenes at least 95%', () => {
  const { report } = sceneWires(objects);
  for (const r of report) assert.ok(r.drawn >= r.things * 0.75, `${r.scene}: ${r.drawn} of ${r.things}`);
  const things = report.reduce((n, r) => n + r.things, 0), drawn = report.reduce((n, r) => n + r.drawn, 0);
  assert.equal(things, has.length);
  assert.ok(drawn >= things * 0.95, `${drawn} of ${things}`);
});

test('every scene composes into a picture: each drawn instance lies inside the frame and its preview exists', () => {
  const dir = join(WORLDS_DIR, 'k.scenes', 'preview');
  const all = readScenes(scenes);
  assert.equal(all.length, sceneFacts.length);
  for (const s of all) {
    const placed = layout(s);
    assert.ok(placed.length >= 8, `${s.name}: ${placed.length} instances`);
    for (const i of placed) {
      assert.ok(i.x >= 0 && i.y >= 0 && i.x + i.s <= WIDTH + 0.01 && i.y <= HEIGHT, `${s.name}: ${i.thing} at ${i.x},${i.y}`);
      assert.ok(existsSync(join(WORLDS_DIR, 'k.objects', 'preview', `${fileOf(i.drawing)}.svg`)), `${s.name}: ${i.drawing}`);
    }
    assert.equal(readFileSync(join(dir, `${fileOf(s.name)}.svg`), 'utf8'), renderScene(s), s.name);
  }
  const beach = layout(all.find((s) => s.name === 'beach'));
  const sea = beach.find((i) => i.thing === 'sea'), boat = beach.find((i) => i.thing === 'sailboat'), sun = beach.find((i) => i.thing === 'sun'), crab = beach.find((i) => i.thing === 'crab');
  assert.ok(sea.fills && boat.y + boat.s > sea.y && boat.y < sea.y + sea.h, 'the boat is on the sea');
  assert.ok(sun.y < sea.y && crab.y > sea.y + sea.h, 'the sun is above the sea, the crab below it');
});
