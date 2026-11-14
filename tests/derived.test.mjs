// Derived facts visible to tools (reviewer block 2026-11-14 02:45, item 3): tools/derive.mjs runs the rules of each
// module over its told facts and writes what they make into the generated shards `derived*`. The shards on disk
// must be what the tool gives now (fresh); every wire is marked and names a rule of its own module; loaded with the
// rules, they make nothing twice; and the tools that read shards see them.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from '../tools/sopworld/sopworld.mjs';
import { scanWorlds, fullWorld, readHeader, moduleInfo, WORLDS_DIR } from '../tools/lib/worlds.mjs';
import { deriveAll, ruleWorlds } from '../tools/derive.mjs';
import { joins } from '../tools/joins.mjs';

const worlds = scanWorlds();
const all = deriveAll(worlds);

test('the derived shards are fresh: what tools/derive.mjs gives from the told facts is what is on disk', () => {
  assert.deepEqual(Object.keys(all).sort(), ruleWorlds(worlds).map((w) => w.id).sort());
  for (const w of worlds) {
    const dir = join(WORLDS_DIR, w.id, 'shards');
    const onDisk = (existsSync(dir) ? readdirSync(dir) : []).filter((f) => f.startsWith('derived') && f.endsWith('.sop')).sort();
    assert.deepEqual(onDisk, Object.keys(all[w.id] ?? {}).sort(), w.id);
    for (const f of onDisk) assert.equal(readFileSync(join(dir, f), 'utf8'), all[w.id][f], `${w.id}/${f}: run node tools/derive.mjs`);
  }
});

test('every derived wire is marked derived=true, is of a type of its own world, and names as its only source a rule of its module or of one it imports', () => {
  const importsOf = (id, seen = new Set()) => { for (const d of moduleInfo(worlds.find((w) => w.id === id).schemaText).imports) if (!seen.has(d)) { seen.add(d); importsOf(d, seen); } return seen; };
  for (const [id, files] of Object.entries(all)) {
    const rules = new Set([id, ...importsOf(id)].flatMap((m) => parse(worlds.find((w) => w.id === m).schemaText).filter((x) => x.type === 'core.rule').map((x) => x.id)));
    for (const text of Object.values(files)) {
      assert.equal(readHeader(text).script[0], 'tools/derive.mjs');
      for (const w of parse(text)) {
        assert.deepEqual(w.attrs.derived, ['true'], w.id);
        assert.ok(w.type.startsWith(`${id}.`), w.id);
        assert.equal(w.attrs['core.source'].length, 1, w.id);
        const rule = /^"rule (.+)"$/.exec(w.attrs['core.source'][0])?.[1];
        assert.ok(rules.has(rule), `${w.id}: ${rule}`);
      }
    }
  }
});

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
