// k.scenes (Round 7): the usual place and relative size of drawable things, and the scenes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, WORLDS_DIR, scanWorlds, fullWorld, factsOf } from '../tools/lib/worlds.mjs';
import { readPlaceSize, thingShards, allThings, letterOf } from '../tools/scenes-core.mjs';
import { animalThings } from '../tools/animals-core.mjs';
import { handSources } from '../tools/lib/worlds.mjs';

const worlds = scanWorlds();
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const scenes = fullWorld('k.scenes', worlds);
const objects = new Set(factsOf('k.objects', 'k.objects.object', worlds).map((w) => tok(w.attrs.name[0])));
const standIns = new Set(factsOf('k.objects', 'k.objects.stand_in', worlds).map((w) => tok(w.attrs.name[0])));
const things = scenes.ofType('k.scenes.thing');

test('the things shards are what tools/scenes-core.mjs gives from place-size.tsv and, for the animals it lacks, from animals.tsv', () => {
  const files = thingShards(allThings());
  const dir = join(WORLDS_DIR, 'k.scenes', 'shards');
  assert.deepEqual(readdirSync(dir).filter((f) => f.startsWith('things-')).sort(), Object.keys(files).sort());
  for (const [name, text] of Object.entries(files)) assert.equal(readFileSync(join(dir, name), 'utf8'), text, name);
  assert.equal(letterOf('1st place medal'), '0');
  assert.equal(letterOf('Earth'), 'e');
  assert.throws(() => readPlaceSize('hat\ton_thing\t\tsmall\n'), /on what/);
  assert.throws(() => readPlaceSize('hat\tupstairs\t\tsmall\n'), /place/);
});

test('every thing with a usual place or size is a k.objects object or stand-in, or an animal of k.animals; nearly every object has one', () => {
  const animalRows = new Set(animalThings().rows.map((r) => r.name));
  for (const w of things) {
    const name = tok(w.attrs.name[0]);
    assert.ok(objects.has(name) || standIns.has(name) || animalRows.has(name), `${name} is neither an object nor a stand-in of k.objects, nor an animal`);
    assert.deepEqual(w.attrs.named, ['model'], name);
    assert.ok(handSources(w.attrs['core.source']), name);
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
import { readScenes, compose, renderScene, W as WIDTH } from '../tools/render-scenes.mjs';
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
    assert.ok(handSources(w.attrs['core.source']), w.id);
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

test('every scene composes into a picture: inside the frame, in rows, nothing overlaps but a thing and what it is on', () => {
  const dir = join(WORLDS_DIR, 'k.scenes', 'preview');
  const all = readScenes(scenes);
  assert.equal(all.length, sceneFacts.length);
  for (const s of all) {
    const { height, items } = compose(s);
    assert.ok(items.length >= 8, `${s.name}: ${items.length} instances`);
    assert.ok(height >= 120 && height <= 600, `${s.name}: ${height} px high`);
    const box = (i) => [i.x, i.y, i.x + i.s, i.y + (i.h ?? i.s)];
    for (const i of items) {
      const [x0, y0, x1, y1] = box(i);
      assert.ok(x0 >= 0 && y0 >= 0 && x1 <= WIDTH + 0.01 && y1 <= height + 0.01, `${s.name}: ${i.thing} at ${i.x},${i.y}`);
      assert.ok(i.fills || i.s >= 12, `${s.name}: ${i.thing} is drawn ${i.s} px small`);
      assert.ok(existsSync(join(WORLDS_DIR, 'k.objects', 'preview', `${fileOf(i.drawing)}.svg`)), `${s.name}: ${i.drawing}`);
    }
    for (let a = 0; a < items.length; a++) for (let b = a + 1; b < items.length; b++) {
      const A = items[a], B = items[b];
      if (A.on === B.thing || B.on === A.thing) continue; // a thing and what it is on
      const [ax0, ay0, ax1, ay1] = box(A), [bx0, by0, bx1, by1] = box(B);
      const overlap = Math.min(ax1, bx1) - Math.max(ax0, bx0) > 0.2 && Math.min(ay1, by1) - Math.max(ay0, by0) > 0.2;
      assert.ok(!overlap, `${s.name}: ${A.thing} and ${B.thing} overlap`);
    }
    const text = readFileSync(join(dir, `${fileOf(s.name)}.svg`), 'utf8');
    assert.equal(text, renderScene(s), s.name);
    // One file with nothing outside it (a page shows it with <img>), and no tile behind the drawings.
    for (const m of text.matchAll(/href="([^"]*)"/g)) assert.ok(m[1].startsWith('#o-'), `${s.name}: refers to ${m[1]}`);
    assert.ok(!/<image|url\(|fill="#fafafa"/.test(text), s.name);
    for (const m of text.matchAll(/<use href="#([^"]*)"/g)) assert.ok(text.includes(`<symbol id="${m[1]}"`), `${s.name}: ${m[1]}`);
  }
  const beach = compose(all.find((s) => s.name === 'beach'));
  const of = (n) => beach.items.find((i) => i.thing === n);
  const sea = of('sea'), boat = of('sailboat'), sun = of('sun'), crab = of('crab');
  assert.ok(sea.fills && boat.y >= sea.y && boat.y + boat.s <= sea.y + sea.h, 'the boat is on the sea');
  assert.ok(sun.y + sun.s <= sea.y && crab.y >= sea.y + sea.h, 'the sun is above the sea, the crab below it');
  assert.ok(of('palm tree').s > of('person').s && of('person').s > of('crab').s, 'sizes follow the size class');
  const farm = compose(all.find((s) => s.name === 'farm'));
  const pond = farm.items.find((i) => i.thing === 'pond'), duck = farm.items.find((i) => i.thing === 'duck');
  assert.ok(duck.on === 'pond' && duck.x >= pond.x && duck.x + duck.s <= pond.x + pond.s && duck.y >= pond.y && duck.y + duck.s <= pond.y + pond.s, 'the duck is on the pond');
  const html = readFileSync(join(dir, 'index.html'), 'utf8');
  assert.equal((html.match(/<img /g) ?? []).length, all.length);
});
