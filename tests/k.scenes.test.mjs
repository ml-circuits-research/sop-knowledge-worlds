// k.scenes (Round 7): the usual place and relative size of drawable things, and the scenes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, WORLDS_DIR, scanWorlds, fullWorld, factsOf } from '../tools/lib/worlds.mjs';
import { readPlaceSize, thingShards, allThings, letterOf } from '../tools/scenes-core.mjs';
import { animalThings } from '../tools/animals-core.mjs';
import { handSources } from '../tools/lib/worlds.mjs';
import { sizeClass, measuredSizes, SIZE_STEPS } from '../tools/lib/size-class.mjs';

const worlds = scanWorlds();
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const scenes = fullWorld('k.scenes', worlds);
const objects = new Set(factsOf('k.objects', 'k.objects.object', worlds).map((w) => tok(w.attrs.name[0])));
const standIns = new Set(factsOf('k.objects', 'k.objects.stand_in', worlds).map((w) => tok(w.attrs.name[0])));
// the words of objects (core.word of=k.objects.object.name): a beach ball is drawn by "ball beach"
const objectWords = new Set(factsOf('k.objects', 'core.word', worlds).filter((w) => w.attrs.of?.includes('k.objects.object.name')).flatMap((w) => w.attrs.text.map(tok)));
// things of a scene that no drawable kind draws (reviewer 04:10 item 1): each is a k.scenes.thing and has no drawing
const UNDRAWN = ['diving board', 'mobile', 'stage', 'till'];
const things = scenes.ofType('k.scenes.thing');

test('the things shards are what tools/scenes-core.mjs gives from place-size.tsv and, for the animals it lacks, from animals.tsv', () => {
  const files = thingShards(allThings());
  const dir = join(WORLDS_DIR, 'k.scenes', 'shards');
  assert.deepEqual(readdirSync(dir).filter((f) => f.startsWith('things-')).sort(), Object.keys(files).sort());
  for (const [name, text] of Object.entries(files)) assert.equal(readFileSync(join(dir, name), 'utf8'), text, name);
  assert.equal(letterOf('1st place medal'), '0');
  assert.equal(letterOf('Earth'), 'e');
  assert.throws(() => readPlaceSize('hat\ton_thing\t\tsmall\n', new Map()), /on what/);
  assert.throws(() => readPlaceSize('hat\tupstairs\t\tsmall\n', new Map()), /place/);
});

test('every thing with a usual place or size is a k.objects object, word or stand-in, an animal of k.animals, or a listed thing of a scene that nothing draws; nearly every object has one', () => {
  const animalRows = new Set(animalThings().rows.map((r) => r.name));
  for (const w of things) {
    const name = tok(w.attrs.name[0]);
    assert.ok(objects.has(name) || standIns.has(name) || objectWords.has(name) || animalRows.has(name) || UNDRAWN.includes(name), `${name} is neither an object, a word nor a stand-in of k.objects, nor an animal`);
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

const measured = measuredSizes();

test('the audit of the labels: 200 rows, the wrong ones are corrected in the table', () => {
  const rows = readFileSync(join(REPO, 'sources/hand-core/place-size-audit.tsv'), 'utf8').split('\n').filter((l) => l.trim() && !l.startsWith('#')).map((l) => l.split('\t'));
  assert.equal(rows.length, 200);
  const table = new Map(readPlaceSize(readFileSync(join(REPO, 'sources/hand-core/place-size.tsv'), 'utf8')).map((r) => [r.name, r]));
  for (const [, name, place, on, size, verdict, note] of rows) {
    assert.ok(['right', 'wrong', 'unclear'].includes(verdict), name);
    const now = table.get(name);
    assert.ok(now, name);
    if (verdict === 'wrong') { assert.ok(note, name); assert.notDeepEqual([now.place, now.on, now.size], [place, on, size], `${name} is still as it was`); }
    // KR1 item 3: a size the number decides (numbers.tsv) is no longer the label that was audited
    if (verdict === 'right') assert.deepEqual([now.place, now.on, measured.has(name) ? size : now.size], [place, on, size], name);
  }
  assert.ok(rows.filter((r) => r[5] === 'wrong').length <= 20);
});

// KR1 item 3 (review 2026-11-15, finding 5): size had two homes that disagreed (fence medium but 20 m, chime large but
// 0.5 m, rope small but 10 m: 8 by two classes or more of 623).
test('KR1 item 3: size has one home: the class of every thing with a k.attributes size_about is computed from it, and no table tells it apart', () => {
  assert.deepEqual(SIZE_STEPS.map(([m, c]) => [m, c]), [[0.1, 'tiny'], [0.8, 'small'], [2, 'medium'], [6, 'large'], [Infinity, 'huge']]);
  const metres = new Map(factsOf('k.attributes', 'k.attributes.number', worlds).filter((w) => w.attrs.size_about).map((w) => [tok(w.attrs.name[0]), Number(w.attrs.size_about[0])]));
  let n = 0;
  for (const t of things) {
    const name = tok(t.attrs.name[0]);
    if (!metres.has(name) || !t.attrs.size) continue;
    n++;
    assert.equal(t.attrs.size[0], sizeClass(metres.get(name)), `${name}: ${metres.get(name)} m`);
  }
  assert.ok(n >= 600, `${n} things with both`);
  // the tables cannot tell a size the number gives
  assert.throws(() => readPlaceSize('fence\tground\t\tmedium\n', new Map([['fence', { metres: 20, size: 'huge' }]])), /comes from the number/);
  for (const l of readFileSync(join(REPO, 'sources/hand-core/place-size.tsv'), 'utf8').split('\n').filter((x) => x.trim() && !x.startsWith('#'))) {
    const [name, , , size = ''] = l.split('\t').map((x) => x.trim());
    assert.ok(!(size && measured.has(name)), name);
  }
  // the eight-plus conflicts the review found, resolved by the source (sources/hand-core/numbers-audit.tsv)
  const size = (name) => tok(things.find((t) => tok(t.attrs.name[0]) === name)?.attrs.size?.[0]);
  assert.deepEqual(['chime', 'bandage', 'ribbon', 'holly'].map((x) => [x, metres.get(x), size(x)]), [['chime', 0.5, 'small'], ['bandage', 0.07, 'tiny'], ['ribbon', 0.15, 'small'], ['holly', 0.2, 'small']]);
  for (const x of ['fence', 'rope', 'wire', 'cable', 'pipe']) assert.ok(!metres.has(x) && size(x), `${x}: any length, not plain: the class stays told`);
  assert.equal(size('elephant'), 'huge');
  assert.equal(size('mouse'), 'tiny');
});

// KR1 item 5 (review 2026-11-15, finding 3): k.scenes.scene.time and k.attributes.usage.time had `day`, which k.time's
// parts of the day (morning, afternoon, evening, night) do not have: 3 of 4 values met the join.
test('KR1 item 5: the time of a scene and of a usage is a part of the day of k.time, by a declared join that every value meets', async () => {
  const { parse } = await import('../tools/sopworld/sopworld.mjs');
  const parts = new Set(factsOf('k.time', 'k.time.part_of_day', worlds).map((w) => tok(w.attrs.name[0])));
  assert.deepEqual([...parts].sort(), ['afternoon', 'evening', 'morning', 'night']);
  for (const [world, type] of [['k.scenes', 'k.scenes.scene'], ['k.attributes', 'k.attributes.usage']]) {
    const slot = parse(worlds.find((w) => w.id === world).schemaText).find((x) => x.type === 'core.slot' && x.attrs.of?.[0] === type && x.attrs.key?.[0] === 'time');
    assert.deepEqual([slot.attrs.type, slot.attrs.by, slot.attrs.enum], [['k.time.part_of_day'], ['name'], undefined], type);
    const values = factsOf(world, type, worlds).flatMap((w) => (w.attrs.time ?? []).map(tok));
    assert.ok(values.length > 30, type);
    assert.deepEqual(values.filter((v) => !parts.has(v)), [], type);
  }
  // the daytime is the morning and the afternoon
  assert.deepEqual(scenes.ofType('k.scenes.scene').find((s) => tok(s.attrs.name[0]) === 'beach').attrs.time, ['morning', 'afternoon']);
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

test('the joins of what a scene has close: every thing is a k.scenes.thing, every thing not drawn under its own name has a drawing (but the listed ones and "=-")', () => {
  const named = new Set(things.map((w) => tok(w.attrs.name[0])));
  const undrawn = new Set();
  for (const w of has) {
    const t = tok(w.attrs.thing[0]);
    assert.ok(named.has(t), `${w.id}: ${t} is no k.scenes.thing`);
    if (!w.attrs.drawing) undrawn.add(t);
    // drawn by another object: that object is a word of it, a stand-in for it, or was chosen in the scene (=drawing)
  }
  // the things without a drawing: the four with no drawable kind, and the "=-" things whose namesake object shows another thing
  assert.deepEqual([...undrawn].filter((t) => !objects.has(t)).sort(), UNDRAWN);
  assert.ok(undrawn.size <= UNDRAWN.length + 3, [...undrawn].join(', '));
  for (const t of UNDRAWN) assert.ok(!standIns.has(t), t); // ("mobile" is a word of the phone: another thing)
  assert.equal(scenes.check().issues.filter((i) => i.kind === 'open-join' && i.key === 'thing').length, 0);
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
