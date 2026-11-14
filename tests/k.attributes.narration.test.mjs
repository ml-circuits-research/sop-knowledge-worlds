// Block "00:05" item 1: which keys of the catalog a composition may narrate (k.attributes.narration), computed by
// tools/narration-core.mjs from the catalog's own facts.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from '../tools/sopworld/sopworld.mjs';
import { WORLDS_DIR } from '../tools/lib/worlds.mjs';
import { narration, narrationShard } from '../tools/narration-core.mjs';

const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const one = (w, k) => tok(w.attrs[k]?.[0]);
const rows = parse(readFileSync(join(WORLDS_DIR, 'k.attributes/shards/narration.sop'), 'utf8'));
const by = new Map(rows.map((r) => [`${one(r, 'type')}.${one(r, 'key')}`, r]));

test('narration: the shard is what the tool computes; one fact per slot of every k.* type', () => {
  assert.equal(readFileSync(join(WORLDS_DIR, 'k.attributes/shards/narration.sop'), 'utf8'), narrationShard(narration()));
  const slots = readdirSync(WORLDS_DIR).filter((d) => d.startsWith('k.') && existsSync(join(WORLDS_DIR, d, 'schema.sop')))
    .flatMap((d) => parse(readFileSync(join(WORLDS_DIR, d, 'schema.sop'), 'utf8')).filter((w) => w.type === 'core.slot' && one(w, 'of').startsWith(`${d}.`)).map((w) => `${one(w, 'of')}.${one(w, 'key')}`));
  assert.deepEqual([...by.keys()].sort(), [...new Set(slots)].sort());
  for (const r of rows) {
    if (one(r, 'narrate') === 'no') { assert.ok(one(r, 'why'), `${one(r, 'type')}.${one(r, 'key')}: why`); assert.equal(Number(one(r, 'salience')), 0); assert.ok(!one(r, 'form')); }
    else { assert.ok(one(r, 'form') && one(r, 'basis'), `${one(r, 'type')}.${one(r, 'key')}: form and basis`); assert.ok(!one(r, 'why')); }
  }
});

test('narration: PSys2\'s metadata is not narrated, the attributes it should have said are, by salience', () => {
  const n = (id) => one(by.get(id), 'narrate'), s = (id) => Number(one(by.get(id), 'salience'));
  for (const id of ['k.geo.country.code', 'k.geo.country.code2', 'k.geo.country.formal', 'k.geo.country.name', 'k.geo.country.lat', 'k.animals.animal.drawing',
    'k.words.sense.n', 'k.values.colour.rgb', 'k.genres.source.doi', 'k.attributes.range.cite', 'k.people.role.hat', 'k.faces.slot.x', 'k.kinds.parent.from']) assert.equal(n(id), 'no', id);
  for (const id of ['k.geo.country.capital', 'k.geo.country.population', 'k.geo.country.continent', 'k.animals.animal.eats', 'k.animals.animal.legs',
    'k.animals.animal.class', 'k.attributes.thing.colour', 'k.food.food.made_of', 'k.geo.country.landlocked']) assert.equal(n(id), 'yes', id);
  assert.ok(s('k.geo.country.capital') > s('k.geo.country.region'));
  assert.ok(s('k.geo.country.population') > s('k.geo.country.independent'));
  assert.ok(s('k.animals.animal.eats') > s('k.animals.animal.group'));
  const f = (id) => one(by.get(id), 'form');
  assert.deepEqual(['k.geo.country.landlocked', 'k.animals.animal.legs', 'k.geo.country.population', 'k.animals.animal.class', 'k.words.sense.gloss', 'k.geo.country.capital'].map(f),
    ['state', 'count', 'measure', 'kind', 'text', 'relation']);
});

test('narration: no narrated key holds codes, colour codes, catalog ids or references (checked on the facts)', () => {
  const CODE = /^([A-Z]{2,3}|#[0-9a-fA-F]{6}|(k|w|std)\.[a-z][\w.]*|\$\S+|Q\d+)$/;
  const narrated = new Set(rows.filter((r) => one(r, 'narrate') === 'yes').map((r) => `${one(r, 'type')} ${one(r, 'key')}`));
  const seen = new Map();
  for (const d of readdirSync(WORLDS_DIR).filter((x) => x.startsWith('k.') && existsSync(join(WORLDS_DIR, x, 'shards')))) {
    if (![...narrated].some((x) => x.startsWith(`${d}.`))) continue;
    for (const f of readdirSync(join(WORLDS_DIR, d, 'shards')).sort().slice(0, 40)) {
      for (const line of readFileSync(join(WORLDS_DIR, d, 'shards', f), 'utf8').split('\n')) {
        const m = line.match(/^@\S+ (\S+)/);
        if (!m) continue;
        for (const [, k, val] of line.slice(m[0].length).matchAll(/ ([\w.]+)=("(?:[^"\\]|\\.)*"|\S+)/g)) {
          const id = `${m[1]} ${k}`;
          if (!narrated.has(id)) continue;
          const s = seen.get(id) ?? seen.set(id, { n: 0, code: 0 }).get(id);
          if (s.n >= 200) continue;
          s.n++; if (CODE.test(String(tok(val)))) s.code++;
        }
      }
    }
  }
  const coded = [...seen].filter(([, s]) => s.code > s.n / 2).map(([id]) => id);
  // a unit's symbol (km, kg) is said as such: lower case or not a code; only k.units.unit.symbol may look like one
  assert.deepEqual(coded.filter((id) => id !== 'k.units.unit symbol'), []);
  assert.ok(seen.size >= 150, `${seen.size} narrated keys checked on their facts`);
});
