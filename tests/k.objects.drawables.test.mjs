// Block 03:20 item 4: drawable shapes for frequent catalog lemmas (ship, cottage, thermometer, arrow): a drawing of
// their own where a source has one, else a stand-in of the nearest drawable kind (tools/stand-ins-kinds.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, WORLDS_DIR, scanWorlds, factsOf } from '../tools/lib/worlds.mjs';
import { standIns, standInShards } from '../tools/stand-ins-kinds.mjs';

const worlds = scanWorlds();
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const facts = factsOf('k.objects', ['k.objects.object', 'k.objects.stand_in', 'core.word'], worlds);
const objects = new Set(facts.filter((w) => w.type === 'k.objects.object').map((w) => tok(w.attrs.name[0]).toLowerCase()));
const standins = facts.filter((w) => w.type === 'k.objects.stand_in');
const words = facts.filter((w) => w.type === 'core.word' && tok(w.attrs.of?.[0]) === 'k.objects.object.name');

const RAW = ['sources/wordnet/raw/wordnet31/data.noun', 'sources/frequency-words/raw/en_50k.txt'].every((f) => existsSync(join(REPO, f)));
test('the shards stand-ins-kinds are what tools/stand-ins-kinds.mjs gives', { skip: !RAW && 'raw files not downloaded' }, async () => {
  for (const [f, t] of Object.entries(standInShards(await standIns()))) assert.equal(readFileSync(join(WORLDS_DIR, 'k.objects', 'shards', f), 'utf8'), t, f);
});

test('every stand-in is drawn by an object, and no stand-in has a drawing of its own name', () => {
  for (const s of standins) {
    assert.ok(objects.has(tok(s.attrs.drawing[0]).toLowerCase()), `${s.id}: ${s.attrs.drawing[0]}`);
    assert.ok(!objects.has(tok(s.attrs.name[0]).toLowerCase()), `${s.id}: ${s.attrs.name[0]} has a drawing`);
  }
});

test('a hand-written word of a drawing never names another drawing ("ship" was a word of the boat, and the ship has its own)', () => {
  const clash = words.filter((w) => w.attrs['core.source'].includes('"hand-core 1"'))
    .flatMap((w) => w.attrs.text.map(tok).filter((t) => objects.has(t.toLowerCase()) && t.toLowerCase() !== tok(w.attrs.means[0]).toLowerCase()).map((t) => `${t} -> ${tok(w.attrs.means[0])}`));
  assert.deepEqual(clash, []);
});

test('ship, thermometer and arrow have a drawing of their own; cottage and stork are drawn by their kind', () => {
  for (const n of ['ship', 'thermometer', 'arrow']) assert.ok(objects.has(n), n);
  const by = (n) => standins.filter((s) => tok(s.attrs.name[0]) === n).map((s) => tok(s.attrs.drawing[0]));
  assert.ok(by('cottage').includes('house'));
  assert.ok(by('stork').includes('bird'));
});
