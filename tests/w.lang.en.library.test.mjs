// KR4 (architecture review finding 15; reviewer 15:00 item 2): the tests run on the pinned library's functions, not
// on copies in tools/lib/lang-en.mjs. What the library does not do yet is listed with its [LIB] question and the
// failing cases; a listed case that starts to pass fails the test (take it off the list, then delete the local code it
// kept alive).
//  - articleFor: the library's (the local copy is deleted; its own cases are in tests/w.lang.en.templates.test.mjs);
//  - inflectBy: the hand-over's plural table and every head noun of the catalog both ways; the local `inflect` stays
//    for the generated plural shards (core-plurals, catalog-plurals) while the cases of Q87 are open;
//  - readFrames: every third frame example of w.lang.en, compared with the reference frame reader; it stays while Q83 is open
//    (the library reads no `needs`, role maps, fixed values or host lexicons).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse, World, inflectBy, articleFor, readFrames } from '../tools/sopworld/sopworld.mjs';
import { WORLDS_DIR, scanWorlds } from '../tools/lib/worlds.mjs';
import { enWorld, frameReader } from '../tools/lib/lang-en.mjs';
import { catalogNouns } from '../tools/lang-en-catalog-plurals.mjs';

const en = enWorld();
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const one = (w, k) => tok(w.attrs[k]?.[0]);

// Q87 [LIB]: inflectBy cases the w.lang.en rules and irregulars read and the library does not (pin 0.130).
export const Q87 = {
  singular: [],   // all read since library 0.225
  plural_back: [],   // all read back since library 0.225
};

test('KR4: articleFor is the library\'s; a and an by w.lang.en.det before= and the onsets', () => {
  for (const [w, a] of Object.entries({ house: 'a', apple: 'an', hour: 'an', unicorn: 'a', european: 'a', egg: 'an' })) assert.equal(articleFor(en, w), a, w);
});

test('KR4: inflectBy reads the hand-over\'s plural table, but for the cases of Q87', () => {
  const bad = [];
  for (const [pl, sg] of Object.entries({ tables: 'table', boxes: 'box', cherries: 'cherry', wolves: 'wolf', cacti: 'cactus', kiwis: 'kiwi', octopuses: 'octopus', buses: 'bus', glass: 'glass', iris: 'iris',
    mice: 'mouse', feet: 'foot', children: 'child', people: 'person', women: 'woman', sheep: 'sheep', antennae: 'antenna', vertebrae: 'vertebra', potatoes: 'potato', cola: 'cola' })) if (inflectBy(en, pl, 'singular') !== sg) bad.push(`${pl} -> ${inflectBy(en, pl, 'singular')}`);
  for (const [sg, pl] of Object.entries({ table: 'tables', box: 'boxes', cherry: 'cherries', day: 'days', cactus: 'cacti', child: 'children', mouse: 'mice', sheep: 'sheep', antenna: 'antennas', tomato: 'tomatoes' })) if (inflectBy(en, sg, 'plural') !== pl) bad.push(`${sg} -> ${inflectBy(en, sg, 'plural')}`);
  assert.deepEqual(bad, [], 'Q87');
});

test('KR4: inflectBy reads every head noun of the catalog both ways, but for the cases of Q87', () => {
  const heads = catalogNouns();
  const irregular = new Set(en.ofType('w.lang.en.irregular').map((x) => tok(x.attrs.singular[0])));
  const sg = (w) => inflectBy(en, w, 'singular'), pl = (w) => inflectBy(en, w, 'plural');
  const singular = [], back = [];
  let checked = 0;
  for (const [h] of heads) {
    if (!irregular.has(h) && sg(h) !== h && heads.nouns.has(sg(h)) && !Q87.singular.includes(h)) continue; // a plural itself (glasses)
    checked += 1;
    if (sg(h) !== h) singular.push(h); else if (sg(pl(h)) !== h) back.push(h);
  }
  console.log(`# ${checked} head nouns; the library reads ${checked - singular.length - back.length} both ways; Q87: ${singular.length} read as plurals, ${back.length} whose plural does not read back`);
  assert.deepEqual(singular.sort(), [...Q87.singular].sort(), 'singular (Q87)');
  assert.deepEqual(back.sort(), [...Q87.plural_back].sort(), 'plural back (Q87)');
});

test('KR4: readFrames on every frame example, against the reference frame reader (Q83)', () => {
  const worlds = scanWorlds();
  const both = new World({ library: Object.fromEntries(worlds.map((w) => [w.id, w.schemaText])) });
  both.use('w.lang.en'); both.use('k.actions');
  for (const id of ['w.lang.en', 'k.actions']) for (const s of worlds.find((w) => w.id === id).shards) both.tell(s.text);
  const shards = (id) => readdirSync(join(WORLDS_DIR, id, 'shards')).filter((f) => f.endsWith('.sop')).sort().flatMap((f) => parse(readFileSync(join(WORLDS_DIR, id, 'shards', f), 'utf8')));
  const all = shards('w.lang.en'), actions = shards('k.actions');
  // every third frame example (a file stays under 30 s): the measure, not every frame, is what Q83 needs
  const frames = all.filter((w) => w.type === 'w.lang.en.frame').filter((_, i) => i % 3 === 0);
  let same = 0, sameAct = 0;
  for (const f of frames) {
    const name = one(f, 'name'), ex = one(f, 'example'), needs = one(f, 'needs');
    const local = frameReader(all, actions, { openLexicons: true, needs: (n) => n === undefined || n === needs })(ex)[0];
    const lib = readFrames(both, ex, { lang: 'w.lang.en' }).best;
    if (lib && (lib.frame === name || lib.frame === local?.frame)) same += 1;
    else if (lib && local && lib.act === local.act && (lib.mode ?? null) === (local.mode ?? null)) sameAct += 1;
  }
  console.log(`# ${frames.length} frame examples: readFrames takes the same frame for ${same}, another frame of the same act and mode for ${sameAct}, ${frames.length - same - sameAct} otherwise (Q83)`);
  assert.ok(same * 2 >= frames.length * 0.95, `${same} of ${frames.length}`); // half at 0.130 (249 of all 498): no regression; the reference reader stays until Q83 is answered
});
