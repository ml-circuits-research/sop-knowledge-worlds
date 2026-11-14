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
    // besides the told source, a loaded wire may carry the rule that derived `kind_of` (shard derived)
    assert.deepEqual(w.attrs['core.source'].filter((x) => !x.startsWith('"rule ')), ['"hand-core 1"'], w.id);
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

// ---- R7.5: roles and jobs
import { readdirSync } from 'node:fs';
import { roleShards, ROLES } from '../tools/people-core.mjs';

const roles = people.ofType('k.people.role');
const facesWorld = fullWorld('k.faces', worlds);
const variants = new Set(facesWorld.ofType('k.faces.variant').filter((w) => tok(w.attrs.style[0]) === 'plain').map((w) => `${tok(w.attrs.slot[0])} ${tok(w.attrs.name[0])}`));
const sceneNames = new Set(fullWorld('k.scenes', worlds).ofType('k.scenes.scene').map((w) => tok(w.attrs.name[0])));

test('the role shards are what tools/people-core.mjs gives; 60 roles in three groups', () => {
  const files = roleShards();
  const dir = join(WORLDS_DIR, 'k.people', 'shards');
  assert.deepEqual(readdirSync(dir).filter((f) => f.startsWith('roles-')).sort(), Object.keys(files).sort());
  for (const [name, text] of Object.entries(files)) assert.equal(readFileSync(join(dir, name), 'utf8'), text, name);
  assert.equal(roles.length, ROLES.length);
  assert.ok(roles.length >= 60);
  for (const name of ['doctor', 'farmer', 'pirate', 'astronaut', 'grandmother']) assert.ok(roles.some((w) => tok(w.attrs.name[0]) === name), name);
});

test('a role is drawn by the person; its kind is a kind; its face features are k.faces variants of style plain', () => {
  const kindNames = new Set(kinds.map((w) => tok(w.attrs.name[0])));
  for (const w of roles) {
    assert.equal(tok(w.attrs.drawing[0]), 'person', w.id);
    for (const k of w.attrs.is ?? []) assert.ok(kindNames.has(tok(k)), `${w.id}: is ${k}`);
    for (const slot of ['hat', 'glasses', 'beard', 'moustache', 'shoulders']) for (const v of w.attrs[slot] ?? []) assert.ok(variants.has(`${slot} ${tok(v)}`), `${w.id}: ${slot} ${v}`);
    for (const f of w.attrs.face ?? []) assert.ok(presets.has(tok(f)), `${w.id}: face ${f}`);
    assert.ok(w.attrs.does?.length, `${w.id}: what the role does`);
    // besides the told source, a loaded wire may carry the rule that derived `kind_of` (shard derived)
    assert.deepEqual(w.attrs['core.source'].filter((x) => !x.startsWith('"rule ')), ['"hand-core 1"'], w.id);
  }
});

test('jobs show on the face: at most five jobs have neither a hat, glasses, a beard nor work clothes; few share a face', () => {
  const ordinary = new Set(['t-shirt', 'shirt', 'v-neck', 'hoodie', 'tank top', 'suit', undefined]);
  const jobs = people.ofType('k.people.role').filter((w) => tok(w.attrs.group[0]) === 'job');
  const plain = jobs.filter((w) => !w.attrs.hat && !w.attrs.glasses && !w.attrs.beard && !w.attrs.moustache && ordinary.has(tok(w.attrs.shoulders?.[0])));
  assert.ok(plain.length <= 5, plain.map((w) => tok(w.attrs.name[0])).join(', '));
  const faces = new Set(jobs.map((w) => ['hat', 'glasses', 'beard', 'moustache', 'shoulders'].map((k) => w.attrs[k]?.[0] ?? '').join('/')));
  assert.ok(faces.size >= jobs.length - 3, `${faces.size} different faces for ${jobs.length} jobs`);
});

test('what roles wear, hold and use has a drawing for at least 95%; where they work is a scene for at least 90%', () => {
  let things = 0, drawn = 0, places = 0, found = 0;
  for (const w of roles) {
    for (const key of ['wears', 'holds', 'uses']) for (const v of w.attrs[key] ?? []) { things++; if (objects.has(tok(v))) drawn++; }
    for (const v of w.attrs.works_at ?? []) { places++; if (sceneNames.has(tok(v))) found++; }
  }
  assert.ok(things >= 200, `${things} things`);
  assert.ok(drawn >= things * 0.95, `${drawn} of ${things} things have a drawing`);
  assert.ok(found >= places * 0.9, `${found} of ${places} places are scenes`);
});
