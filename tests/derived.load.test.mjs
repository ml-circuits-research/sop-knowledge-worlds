// Derived facts, second half (split from tests/derived.test.mjs, which was killed by memory five times and shown as
// passing: review 2026-11-15, finding 1): loaded with the rules, the derived shards on disk make nothing twice, a told
// value is never written as derived, and the tools that read shards see them. Freshness (disk = tools/derive.mjs) is
// checked in tests/derived.test.mjs, so this file reads the shards from disk.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse } from '../tools/sopworld/sopworld.mjs';
import { scanWorlds, fullWorld } from '../tools/lib/worlds.mjs';
import { joins } from '../tools/joins.mjs';

const worlds = scanWorlds();
const isDerived = (s) => s.id.split('/').pop().startsWith('derived');
const all = Object.fromEntries(worlds.map((w) => [w.id, Object.fromEntries(w.shards.filter(isDerived).map((s) => [`${s.id.split('/').pop()}.sop`, s.text]))]).filter(([, f]) => Object.keys(f).length));

test('loaded with the rules, the derived shards make nothing twice and change no value', () => {
  const strip = worlds.map((w) => ({ ...w, shards: w.shards.filter((s) => !s.id.split('/').pop().startsWith('derived')) }));
  const values = (world, type) => world.ofType(type).map((w) => JSON.stringify(Object.entries(w.attrs).filter(([k]) => !k.startsWith('core.') && k !== 'derived').map(([k, v]) => [k, [...v].sort()]).sort())).sort();
  for (const [id, types] of [['k.commonsense', ['k.commonsense.thing']], ['k.time', ['k.time.before', 'k.time.season_in']], ['k.shapes', ['k.shapes.shape']], ['k.people', ['k.people.kind']]]) {
    const a = fullWorld(id, worlds), b = fullWorld(id, strip);
    for (const t of types) assert.deepEqual(values(a, t), values(b, t), `${id} ${t}`);
  }
});

test('a told value is never written as derived; the tools that read shards see the derived facts', () => {
  const told = new Set();
  for (const w of worlds) for (const s of w.shards) if (!s.id.split('/').pop().startsWith('derived')) for (const x of parse(s.text)) if (x.type === 'k.commonsense.thing') for (const v of x.attrs.at ?? []) told.add(`${x.attrs.name[0]} ${v}`);
  for (const x of parse(all['k.commonsense']['derived.sop'])) for (const v of x.attrs.at ?? []) assert.ok(!told.has(`${x.attrs.name[0]} ${v}`), `${x.id} at=${v}`);
  // the dolphin's place, the swift's flying, lemonade a liquid (tea is told), Monday before Friday: now in shards
  const text = Object.values(all).flatMap((f) => Object.values(f)).join('\n');
  for (const re of [/k\.commonsense\.thing name=dolphin at=sea /, /name=swift can=fly/, /name=lemonade is_a=liquid/, /k\.time\.before cycle=week earlier=Monday later=Friday /, /season=winter hemisphere=north first=December /, /k\.shapes\.shape name=square kind_of=polygon kind_of=quadrilateral derived=true core\.source="rule k\.kinds\.up\.step"/]) assert.match(text, re);
  // the joins table files a derived k.commonsense.thing under the sense of the type its rule reads
  const dolphin = joins(worlds).rows.find((r) => r.name === 'dolphin');
  assert.ok(dolphin.in.includes('k.commonsense.thing') && dolphin.sense === 'animal');
});
