// Given names (Q62): k.people.given_name, from Wikidata's given-name items (CC0) by tools/import/given-names.mjs.
// A reader must tell a given name from a miss: Zoe, Ana, Tom and Leo (words of the failing paraphrases whose senses
// in k.words were a collection of anecdotes, a male animal, a constellation) are given names here.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR, scanWorlds, factsOf } from '../tools/lib/worlds.mjs';
import { shards, givenNames, bandOf, RAW } from '../tools/import/given-names.mjs';

const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const dir = join(WORLDS_DIR, 'k.people', 'shards');
const worlds = scanWorlds();
const names = factsOf('k.people', ['k.people.given_name'], worlds);
const byName = new Map(names.map((w) => [tok(w.attrs.name[0]), w]));

test('Zoe, Ana, Tom and Leo are given names, with their sex and band', () => {
  for (const [n, sex] of [['Zoe', 'female'], ['Ana', 'female'], ['Tom', 'male'], ['Leo', 'male']]) {
    const w = byName.get(n);
    assert.ok(w, n);
    assert.deepEqual(w.attrs.sex.map(tok), [sex], n);
    assert.ok(['very common', 'common', 'frequent'].includes(tok(w.attrs.band[0])), `${n}: ${w.attrs.band}`);
  }
  // a unisex name has both sexes; common words that are no names are not here
  assert.ok(names.some((w) => w.attrs.sex.length === 2));
  for (const miss of ['subhead', 'lei', 'table']) assert.ok(!byName.has(miss) && !byName.has(miss[0].toUpperCase() + miss.slice(1)), miss);
});

test('every name has its sexes, holders, a band computed from them and a Wikidata item; ids are unique', () => {
  assert.ok(names.length >= 2900, `${names.length}`);
  const ids = new Set();
  for (const w of names) {
    assert.ok(!ids.has(w.id), w.id); ids.add(w.id);
    assert.ok(w.attrs.sex.length >= 1, w.id);
    assert.equal(tok(w.attrs.band[0]), bandOf(Number(w.attrs.holders[0])), w.id);
    assert.ok(w.attrs.wikidata.every((q) => /^Q\d+$/.test(q)), w.id);
    assert.equal(w.attrs['core.source']?.[0], '"wikidata-given-names 2026-11-14"', w.id);
  }
});

test('the shards are the import\'s output (when the raw file is there) and each is under the size gate', (t) => {
  const files = readdirSync(dir).filter((f) => f.startsWith('given-names-'));
  for (const f of files) assert.ok(readFileSync(join(dir, f)).length < 300000, f);
  if (!existsSync(RAW)) { t.skip('sources/given-names/raw/given-names.tsv not fetched (see sources/given-names/SOURCE.md)'); return; }
  const want = shards(givenNames());
  assert.deepEqual(files.sort(), Object.keys(want).sort());
  for (const [f, text] of Object.entries(want)) assert.equal(readFileSync(join(dir, f), 'utf8'), text, `${f}: run node tools/import/given-names.mjs`);
});
