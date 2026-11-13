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
