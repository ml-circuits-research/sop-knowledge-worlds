// Conversation frames (reviewer block 2026-11-15 09:20 K3, PSys2 Q18): PSys2's real rows (training/eval/
// real-2026-11-15.jsonl) read back to the acts greet, thank, farewell of k.actions and to the questions about the
// assistant; what the speaker says about themselves is w.person's (shard person-frames), read here only when it is there.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from '../tools/sopworld/sopworld.mjs';
import { WORLDS_DIR } from '../tools/lib/worlds.mjs';
import { frameReader } from '../tools/lib/lang-en.mjs';
import { talkFrameShard } from '../tools/lang-en-talk-frames.mjs';

const shards = (id) => readdirSync(join(WORLDS_DIR, id, 'shards')).filter((f) => f.endsWith('.sop')).sort().flatMap((f) => parse(readFileSync(join(WORLDS_DIR, id, 'shards', f), 'utf8')));
const all = shards('w.lang.en'), actions = shards('k.actions');
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const one = (w, k) => tok(w.attrs[k]?.[0]);
const read = frameReader(all, actions, { needs: (n) => [undefined, 'attrs', 'values', 'in', 'dir', 'number', 'named', 'person'].includes(n) });

const ROWS = [
  ['hello', 'r0166', 'greet/', {}], ['Hello', 'r0216', 'greet/', {}], ['hello', 'r0630', 'greet/', {}],
  ...['r0588', 'r0591', 'r0594', 'r0597', 'r0600', 'r0603', 'r0606', 'r0612'].map((id) => ['thanks', id, 'thank/', {}]),
  ['Hi there!', '', 'greet/', {}], ['good morning robi', '', 'greet/', { person: 'robi' }], ['Thank you for the drawing.', '', 'thank/', { topic: 'drawing' }],
  ['thank you very much', '', 'thank/', {}], ['bye', '', 'farewell/', {}], ['see you later', '', 'farewell/', {}], ['good night robi', '', 'farewell/', { person: 'robi' }],
  ['who are you?', '', 'ask/who', { thing: 'yourself', topic: 'identity' }], ['how are you doing today', '', 'ask/feeling', { thing: 'yourself', topic: 'feeling' }],
];

test('the shard talk-frames is what tools/lang-en-talk-frames.mjs gives', () => {
  assert.equal(readFileSync(join(WORLDS_DIR, 'w.lang.en', 'shards', 'talk-frames.sop'), 'utf8'), talkFrameShard());
});

test('real rows: "hello" (r0166, r0216, r0630) is greet and "thanks" (8 rows) is thank; goodbyes and questions about the assistant', () => {
  const bad = [];
  for (const [s, id, am, args] of ROWS) {
    const [r] = read(s);
    const got = r ? `${r.act}/${r.mode ?? ''} ${JSON.stringify(Object.fromEntries(Object.entries(r.args).sort()))}` : 'nothing';
    const want = `${am} ${JSON.stringify(Object.fromEntries(Object.entries(args).sort()))}`;
    if (got !== want) bad.push(`${id || '-'} "${s}": ${got} (${r?.frame}), want ${want}`);
  }
  assert.deepEqual(bad, []);
  // a request with a polite word is still the request
  assert.equal(read('draw a cat please')[0].act, 'make');
});

test('the acts are k.actions acts of the family conversation, greet and farewell opposites', () => {
  const acts = new Map(actions.filter((w) => w.type === 'k.actions.act').map((a) => [one(a, 'name'), a]));
  for (const a of ['greet', 'thank', 'farewell']) assert.ok(acts.has(a), a);
  assert.equal(one(acts.get('greet'), 'opposite'), 'farewell');
  const fam = shards('k.actions').filter((w) => w.type === 'k.actions.member' && one(w, 'family') === 'conversation').map((w) => one(w, 'act')).sort();
  assert.deepEqual(fam, ['farewell', 'greet', 'thank']);
});

test('"who am I?" (r0148) and "my name is Ana" are w.person\'s frames (shard person-frames), not repeated here', { skip: !existsSync(join(WORLDS_DIR, 'w.lang.en', 'shards', 'person-frames.sop')) && 'w.person frames not on this tree yet' }, () => {
  const r = read('who am I?')[0];
  assert.equal(r.act, 'ask');
  assert.equal(r.args.thing, 'me');
  assert.equal(read('my name is Ana')[0].args.attribute, 'name');
});
