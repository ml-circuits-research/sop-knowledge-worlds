// Q67 (b): the CLDR, OpenMoji and Mulberry keywords of a drawing are k.objects.keyword facts (search words), not
// core.word facts (names): a host takes the object of the word's own name, a word of an object or a stand-in first,
// and a keyword only when none matched (tools/objects-lookup.mjs). "Add a ship" draws the ship, never the anchor.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scanWorlds, factsOf, vocabularyWorld } from '../tools/lib/worlds.mjs';
import { drawingIndex, drawingFor, LOOKUP_TYPES } from '../tools/objects-lookup.mjs';

const worlds = scanWorlds();
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const facts = factsOf('k.objects', LOOKUP_TYPES, worlds);
const ix = drawingIndex(facts);
const keywords = facts.filter((w) => w.type === 'k.objects.keyword');
const IMPORTED = /^"(cldr|openmoji|mulberry) /;

test('the imported keywords are k.objects.keyword facts, and no word of an object comes from an image library', () => {
  assert.ok(keywords.length >= 1500, `${keywords.length} keyword facts`);
  for (const w of keywords) {
    assert.ok(IMPORTED.test(w.attrs['core.source'][0]), `${w.id}: ${w.attrs['core.source']}`);
    assert.ok(ix.objects.has(tok(w.attrs.of[0]).toLowerCase()), `${w.id}: no object ${w.attrs.of[0]}`);
  }
  const words = facts.filter((w) => w.type === 'core.word' && w.attrs.of?.includes('k.objects.object.name'));
  assert.deepEqual(words.filter((w) => w.attrs['core.source'].some((s) => IMPORTED.test(s))).map((w) => w.id), []);
});

test('no keyword resolves before a drawing\'s own name, a word of a drawing or a stand-in', () => {
  const earlier = { name: 0, word: 0, stand_in: 0 };
  for (const w of keywords) for (const t of w.attrs.text.map(tok)) {
    const r = drawingFor(t, ix);
    const k = t.toLowerCase();
    if (ix.objects.has(k)) assert.deepEqual([r.via, r.drawing], ['name', ix.objects.get(k)], t);
    else if (ix.words.has(k)) assert.deepEqual([r.via, r.drawing], ['word', ix.words.get(k)[0]], t);
    else if (ix.standIns.has(k)) assert.deepEqual([r.via, r.drawing], ['stand_in', ix.standIns.get(k)[0]], t);
    else assert.equal(r.via, 'keyword', t);
    if (r.via !== 'keyword') earlier[r.via]++;
  }
  // Q67 counted 1,266 keyword texts that are names of other drawings; each now loses to the name
  assert.ok(earlier.name >= 1266, JSON.stringify(earlier));
  assert.deepEqual(drawingFor('ship', ix), { drawing: 'ship', via: 'name', others: [] });
  assert.deepEqual(drawingFor('kitty', ix), { drawing: 'kitten', via: 'word', others: [] });
  assert.equal(drawingFor('gobble', ix).drawing, 'turkey');
  assert.equal(drawingFor('gobble', ix).via, 'keyword');
  assert.equal(drawingFor('no such thing at all', ix), null);
});

test('the engine\'s word reading does not see a keyword (a keyword is not a core.word)', () => {
  const { world, result } = vocabularyWorld(worlds, 'k.objects');
  assert.ok(result.ok);
  const shard = worlds.find((w) => w.id === 'k.objects').shards.find((s) => s.id === 'k.objects/shards/noto-animal-bird-01');
  const r = world.tell(shard.text);
  assert.ok(r.ok, JSON.stringify(r.violations));
  assert.ok(world.ofType('k.objects.keyword').some((w) => w.attrs.of?.includes('turkey') && w.attrs.text.includes('gobble')));
  const words = world.words();
  const has = (t) => (words instanceof Map ? words.has(t) : Object.hasOwn(words, t));
  assert.ok(has('drawing') && has('keyword'), 'the explicitly composed owned vocabulary is read');
  assert.ok(!has('gobble') && !has('thanksgiving'), 'a keyword became a word');
});
