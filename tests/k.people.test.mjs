// k.people (Round 7): the kinds of person as variants of one person drawing; roles and jobs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR, scanWorlds, fullWorld } from '../tools/lib/worlds.mjs';

const worlds = scanWorlds();
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const people = fullWorld('k.people', worlds);
const kinds = people.ofType('k.people.kind');
const objects = new Set(fullWorld('k.objects', worlds).ofType('k.objects.object').map((w) => tok(w.attrs.name[0])));
const presets = new Set(fullWorld('k.faces', worlds).ofType('k.faces.preset').filter((w) => tok(w.attrs.style[0]) === 'plain').map((w) => tok(w.attrs.name[0])));

test('the eight kinds of person are variants of the one person drawing, each with a k.faces preset', () => {
  const names = kinds.map((w) => tok(w.attrs.name[0])).sort();
  assert.deepEqual(names, ['baby', 'boy', 'child', 'girl', 'grandfather', 'grandmother', 'man', 'woman']);
  for (const w of kinds) {
    assert.equal(tok(w.attrs.drawing[0]), 'person', w.id);
    assert.ok(objects.has('person'));
    assert.ok(presets.has(tok(w.attrs.face[0])), `${w.id}: no preset ${w.attrs.face[0]}`);
    for (const k of w.attrs.is_a ?? []) assert.ok(names.includes(tok(k)), `${w.id} is_a ${k}`);
    assert.deepEqual(w.attrs['core.source'], ['"hand-core 1"'], w.id);
  }
  const height = Object.fromEntries(kinds.map((w) => [tok(w.attrs.name[0]), Number(w.attrs.height_about[0])]));
  assert.ok(height.baby < height.child && height.child < height.boy && height.boy < height.woman && height.woman < height.man);
  assert.ok(height.grandfather < height.man && height.grandmother < height.woman);
});

test('every kind is reached by any of its names: the vocabulary index sends the word to the shard', () => {
  const vocab = JSON.parse(readFileSync(join(WORLDS_DIR, 'vocab.json'), 'utf8'));
  for (const word of ['baby', 'infant', 'child', 'children', 'kid', 'boy', 'girl', 'man', 'men', 'woman', 'women', 'lady', 'grandfather', 'grandpa', 'granddad', 'grandmother', 'grandma', 'granny'])
    assert.ok(vocab[word]?.includes('k.people/shards/kinds'), word);
  const words = people.ofType('core.word').filter((w) => w.attrs.of?.[0] === 'k.people.kind.name');
  const names = new Set(kinds.map((w) => tok(w.attrs.name[0])));
  for (const w of words) assert.ok(names.has(tok(w.attrs.means[0])), w.id);
});
