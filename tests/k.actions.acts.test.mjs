// k.actions, the words of the acts (Round 8, item 1): acts, roles with markers, verbs from WordNet senses and by hand.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, WORLDS_DIR, scanWorlds, fullWorld } from '../tools/lib/worlds.mjs';
import { actShards, ACTS, readVerbs, checkVerbs, glossesFromRaw, GLOSSES_TSV } from '../tools/acts-core.mjs';

const worlds = scanWorlds();
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const one = (w, k) => tok(w.attrs[k]?.[0]);
const world = fullWorld('k.actions', worlds);
const acts = world.ofType('k.actions.act'), roles = world.ofType('k.actions.role');
const verbs = world.ofType('k.actions.verb'), markings = world.ofType('k.actions.marking');

test('the shards are what tools/acts-core.mjs gives; the 14 acts asked for are there', () => {
  for (const [name, text] of Object.entries(actShards())) assert.equal(readFileSync(join(WORLDS_DIR, 'k.actions', 'shards', name), 'utf8'), text, name);
  assert.deepEqual(checkVerbs(), []);
  const names = acts.map((w) => one(w, 'name'));
  for (const n of ['make', 'remove', 'change', 'place', 'connect', 'group', 'take apart', 'pick', 'ask', 'copy', 'send', 'undo', 'save', 'load']) assert.ok(names.includes(n), n);
  assert.equal(acts.length, ACTS.length);
  for (const a of acts) for (const o of a.attrs.opposite ?? []) assert.ok(names.includes(tok(o)), a.id);
});

test('every act has roles; every role of a verb or a marking is a role of its act; every act has verbs', () => {
  const rolesOf = new Map(acts.map((a) => [one(a, 'name'), new Set(a.attrs.role.map(tok))]));
  for (const r of roles) assert.ok(rolesOf.get(one(r, 'act'))?.has(one(r, 'name')), r.id);
  assert.equal(roles.length, [...rolesOf.values()].reduce((n, s) => n + s.size, 0));
  const count = new Map();
  for (const v of verbs) {
    const mine = rolesOf.get(one(v, 'act'));
    assert.ok(mine, v.id);
    for (const k of ['object', 'complement', 'after_particle']) if (v.attrs[k]) assert.ok(mine.has(one(v, k)), `${v.id} ${k}`);
    count.set(one(v, 'act'), (count.get(one(v, 'act')) ?? 0) + 1);
    // A verb from WordNet names its senses and a gloss and says who read it; a hand-written one has neither.
    if (one(v, 'core.source') === 'wordnet 3.1') { assert.ok(v.attrs.sense?.length && v.attrs.gloss && one(v, 'named') === 'model', v.id); }
    else { assert.equal(one(v, 'core.source'), 'hand-core 1'); assert.ok(!v.attrs.sense && !v.attrs.gloss && !v.attrs.named, v.id); }
    if (v.attrs.after_particle) assert.ok(v.attrs.separable, v.id);
    if (v.attrs.separable) assert.ok(one(v, 'text').includes(' '), `${v.id}: only a phrasal verb is separable`);
  }
  for (const [name] of rolesOf) assert.ok(count.get(name) >= 5, `${name}: ${count.get(name)} verbs`);
  const verbKeys = new Set(verbs.map((v) => `${one(v, 'text')} ${one(v, 'act')}`));
  for (const m of markings) { assert.ok(verbKeys.has(`${one(m, 'verb')} ${one(m, 'act')}`), m.id); assert.ok(rolesOf.get(one(m, 'act')).has(one(m, 'role')), m.id); }
  assert.equal(verbs.length, readVerbs().length);
  assert.ok(verbs.length >= 280);
});

test('the phrasal verbs asked for are there, with their acts', () => {
  const actsOf = (t) => verbs.filter((v) => one(v, 'text') === t).map((v) => one(v, 'act')).sort();
  assert.deepEqual(actsOf('put on'), ['make', 'place']);
  assert.deepEqual(actsOf('take off'), ['remove']);
  assert.deepEqual(actsOf('get rid of'), ['remove']);
  assert.deepEqual(actsOf('turn into'), ['change']);
  const enlarge = verbs.find((v) => one(v, 'text') === 'enlarge');
  assert.equal(one(enlarge, 'attribute'), 'size'); assert.equal(one(enlarge, 'value'), 'larger');
});

test('the senses named are senses of k.words where k.words keeps the verb sense, with the same gloss', () => {
  const words = fullWorld('k.words', worlds);
  const gloss = new Map(words.ofType('k.words.sense').filter((s) => one(s, 'pos') === 'verb').map((s) => [`${one(s, 'word')} ${one(s, 'n')}`, one(s, 'gloss')]));
  let joined = 0;
  for (const v of verbs) {
    const g = gloss.get(`${one(v, 'text')} ${one(v, 'sense')}`);
    if (g === undefined) continue;
    joined++;
    assert.equal(one(v, 'gloss'), g, v.id);
  }
  assert.ok(joined >= 100, `${joined} verbs join k.words`);
});

test('the table of glosses is what the raw WordNet files give (when they are there)', { skip: !existsSync(join(REPO, 'sources/wordnet/raw/wordnet31/data.verb')) }, async () => {
  assert.equal(readFileSync(GLOSSES_TSV, 'utf8'), await glossesFromRaw());
});

test('verbs reach their shard through the vocabulary index', () => {
  const vocab = JSON.parse(readFileSync(join(WORLDS_DIR, 'vocab.json'), 'utf8'));
  for (const [word, shard] of [['erase', 'verbs-remove'], ['get rid of', 'verbs-remove'], ['put on', 'verbs-place'], ['enlarge', 'verbs-change'], ['ungroup', 'verbs-take_apart']]) assert.ok(vocab[word]?.includes(`k.actions/shards/${shard}`), word);
});

test('the PSys2 hand-over k.actions-missing.md: redo and deselect are acts with their opposites; download and export save with a format; the verbs it named are there', () => {
  const act = (n) => acts.find((a) => one(a, 'name') === n);
  assert.equal(one(act('redo'), 'opposite'), 'undo');
  assert.equal(one(act('undo'), 'opposite'), 'redo');
  assert.equal(one(act('deselect'), 'opposite'), 'pick');
  assert.equal(one(act('pick'), 'opposite'), 'deselect');
  const actsOf = (text) => verbs.filter((v) => one(v, 'text') === text).map((v) => one(v, 'act')).sort();
  assert.deepEqual(actsOf('download'), ['save']);
  assert.ok(markings.some((m) => one(m, 'verb') === 'export' && one(m, 'marker') === 'as' && one(m, 'role') === 'format'));
  for (const [a, vs] of [['make', ['doodle', 'scribble', 'whip up']], ['place', ['shove', 'nudge', 'scoot']], ['undo', ['step back']], ['redo', ['redo', 'do again', 'get back']],
    ['pick', ['click', 'tap', 'touch']], ['deselect', ['deselect', 'unselect', 'untick']], ['remove', ['wipe']], ['save', ['export']]]) for (const v of vs) assert.ok(actsOf(v).includes(a), `${a}: ${v}`);
});

test('block 07:40 item 4: drop is a verb of remove, reset a verb of change whose value is the default', async () => {
  const { scanWorlds, fullWorld } = await import('../tools/lib/worlds.mjs');
  const w = fullWorld('k.actions', scanWorlds());
  const verb = (text, act) => w.ofType('k.actions.verb').find((v) => v.attrs.text?.[0] === text && v.attrs.act?.[0] === act);
  assert.ok(verb('drop', 'remove'), 'drop: remove');
  assert.equal(verb('reset', 'change')?.attrs.value?.[0], 'default');
});
