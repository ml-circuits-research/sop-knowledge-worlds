// tools/import/psys2.mjs (Round 10, item 0): what was taken from the PSys2 tab worlds.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR, scanWorlds, fullWorld } from '../tools/lib/worlds.mjs';
import { parse } from '../tools/sopworld/sopworld.mjs';
import { importPsys2, psys2Commit, PAGE } from '../tools/import/psys2.mjs';

const worlds = scanWorlds();
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const mine = worlds.flatMap((w) => w.shards.filter((s) => s.id.split('/').pop().startsWith('psys2')));
const page = readFileSync(PAGE, 'utf8');
const commit = /at PSys2 commit `([0-9a-f]+)`/.exec(page)[1];

test('every fact taken names psys2-worlds and its commit as a source; third-party facts keep their own source and licence', () => {
  assert.ok(mine.length >= 15);
  for (const s of mine) {
    const license = /^# license: (.*)$/m.exec(s.text)[1];
    for (const w of parse(s.text)) {
      const src = w.attrs['core.source'].map(tok);
      assert.ok(src.includes(`psys2-worlds ${commit}`), w.id);
      if (s.id.includes('psys2-countries')) { assert.ok(src.includes('countries 5.1.0'), w.id); assert.equal(license, 'ODbL-1.0'); }
      else if (s.id.includes('psys2-cities')) { assert.ok(src.includes('geonames all-the-cities-3.1.0'), w.id); assert.equal(license, 'CC-BY-4.0'); }
      else { assert.deepEqual(src, [`psys2-worlds ${commit}`], w.id); assert.equal(license, 'CC0-1.0'); }
    }
  }
});

test('the facts taken answer: currency, languages, code, groups, cities, sounds, shapes, shades, yes and no, part names', () => {
  const geo = fullWorld('k.geo', worlds);
  const country = (n) => geo.ofType('k.geo.country').find((c) => tok(c.attrs.name[0]) === n);
  assert.equal(tok(country('France').attrs.currency[0]), 'Euro');
  assert.deepEqual(country('France').attrs.code2, ['FR']);
  assert.deepEqual(country('France').attrs.code, ['FRA'], 'the facts of one country merge');
  assert.ok(country('Belgium').attrs.language.length >= 3);
  assert.ok(country('Palestine') && country('Gibraltar'), 'territories that were missing');
  assert.equal(new Set(geo.ofType('k.geo.country').map((c) => c.attrs.code2?.[0]).filter(Boolean)).size, geo.ofType('k.geo.country').filter((c) => c.attrs.code2).length, 'one country per code');
  const groups = geo.ofType('k.geo.group');
  assert.equal(groups.length, 8);
  const names = new Set(geo.ofType('k.geo.country').map((c) => tok(c.attrs.name[0])));
  for (const g of groups) for (const m of g.attrs.member) assert.ok(names.has(tok(m)), `${g.id}: ${m}`);
  assert.equal(groups.find((g) => tok(g.attrs.name[0]) === 'European Union').attrs.member.length, 27);
  const cities = geo.ofType('k.geo.city');
  assert.ok(cities.length >= 1350);
  for (const c of cities) assert.ok(names.has(tok(c.attrs.country[0])), c.id);
  assert.ok(cities.some((c) => tok(c.attrs.name[0]) === 'Genoa' && tok(c.attrs.country[0]) === 'Italy'));
  const animals = fullWorld('k.animals', worlds).ofType('k.animals.animal');
  const dog = animals.find((a) => a.attrs.name[0] === 'dog');
  assert.ok(dog.attrs.sound.includes('woof') && dog.attrs.sound.includes('bark') && dog.attrs.eats.includes('bones'));
  for (const a of animals) assert.ok(!(a.attrs.can ?? []).some((v) => (a.attrs.cannot ?? []).includes(v)), a.id);
  const shapes = fullWorld('k.shapes', worlds).ofType('k.shapes.shape');
  const isA = (n) => shapes.find((s) => tok(s.attrs.name[0]) === n).attrs.is_a?.map(tok);
  assert.deepEqual(isA('rhombus'), ['quadrilateral']); assert.deepEqual(isA('rectangle'), ['quadrilateral']); assert.deepEqual(isA('quadrilateral'), ['polygon']); assert.deepEqual(isA('square'), ['rectangle']);
  const values = fullWorld('k.values', worlds);
  assert.deepEqual(values.ofType('k.values.shade').map((s) => s.attrs.name[0]).sort(), ['bright', 'dark', 'deep', 'light', 'pale', 'soft']);
  assert.deepEqual(values.ofType('k.values.reply').map((s) => s.attrs.name[0]).sort(), ['no', 'yes']);
  const vocab = JSON.parse(readFileSync(join(WORLDS_DIR, 'vocab.json'), 'utf8'));
  for (const w of ['yeah', 'nope', 'ginger', 'uk', 'hippo', 'rhombus']) assert.ok((vocab[w] ?? []).some((id) => id.split('/').pop().startsWith('psys2')), w);
  const called = fullWorld('k.parts', worlds).ofType('k.parts.called');
  assert.ok(called.length >= 80);
  assert.ok(called.find((c) => c.attrs.of[0] === 'tree' && c.attrs.part[0] === 'crown').attrs.also.includes('foliage'));
});

test('FROM-PSYS2.md has a section for every PSys2 file asked for and says what was left', () => {
  for (const f of ['geo.map/kb.sop', 'kids.animals/kb.sop', 'kids.shapes/kb.sop', 'kids.time/kb.sop', 'common.sense/kb.sop', 'space/space.mjs', 'art.draw/scene.mjs', 'lang.common/lexicon.sop']) assert.ok(page.includes(f), f);
  assert.ok((page.match(/\*\*Left:\*\*/g) ?? []).length >= 5);
});

const from = process.env.PSYS2 ?? '/tmp/wt2';
const there = existsSync(join(from, 'worlds', 'geo.map', 'kb.sop')) && psys2Commit(from) === commit;
test('the shards and the page are what the import gives from the PSys2 checkout (when it is there at the same commit)', { skip: !there && 'no PSys2 checkout at the commit of the page' }, () => {
  const { files, page: fresh } = importPsys2(from, commit);
  assert.equal(page, fresh);
  const names = Object.entries(files).flatMap(([world, shards]) => Object.keys(shards).map((f) => `${world}/shards/${f.slice(0, -4)}`)).sort();
  assert.deepEqual(mine.map((s) => s.id).sort(), names);
  for (const [world, shards] of Object.entries(files)) for (const [name, text] of Object.entries(shards)) assert.equal(readFileSync(join(WORLDS_DIR, world, 'shards', name), 'utf8'), text, name);
});
