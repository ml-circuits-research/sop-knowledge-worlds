// PSys2 Q18 K6 (reviewer block 2026-11-15 09:20): frames for lists, tasks, a shop and a wallet in w.lang.en, bound to the
// acts and keys of w.list (K1) and w.tasks (K2), read by the reference reader of tools/lib/lang-en.mjs in a world whose
// frames need `entries` (and the general frames): PSys2's real rows clause by clause, the sentences of its kids.shop and
// kids.tasks worlds that the frames are for, and what the frames must leave alone. Each frame's own example is read in
// tests/w.lang.en.frames.test.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from '../tools/sopworld/sopworld.mjs';
import { WORLDS_DIR } from '../tools/lib/worlds.mjs';
import { frameReader, clauseReader } from '../tools/lib/lang-en.mjs';
import { listFrameShard, moneyWords, FRAMES } from '../tools/lang-en-list-frames.mjs';

const shardsOf = (id) => readdirSync(join(WORLDS_DIR, id, 'shards')).filter((f) => f.endsWith('.sop')).sort().flatMap((f) => parse(readFileSync(join(WORLDS_DIR, id, 'shards', f), 'utf8')));
const all = shardsOf('w.lang.en'), actions = shardsOf('k.actions');
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const one = (w, k) => tok(w.attrs[k]?.[0]);
const read = frameReader(all, actions, { needs: (n) => n === undefined || n === 'entries' });
const clauses = clauseReader(read, all);
// a reading as text: frame-free, act/mode and the k.actions roles, so a table of expected readings stays short
const said = (c) => `${c.act}${c.mode ? `/${c.mode}` : ''} ${Object.entries(c.args).sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, v]) => `${k}=${v}`).join(' ')}`.trim();
const readAll = (s) => clauses(s)?.map(said) ?? null;

test('list-frames: the shard is what tools/lang-en-list-frames.mjs gives; the money words come from k.units', () => {
  assert.equal(readFileSync(join(WORLDS_DIR, 'w.lang.en', 'shards', 'list-frames.sop'), 'utf8'), listFrameShard());
  const words = moneyWords();
  for (const w of ['leu', 'lei', 'ban', 'bani', 'dollar', 'dollars', 'euro', 'euros', 'cent', 'cents', 'pound', 'pence', 'quid', 'yen']) assert.ok(words.includes(w), w);
  assert.ok(!words.some((w) => /^[a-z]{3}$/.test(w) && ['ron', 'usd', 'eur', 'all'].includes(w)), 'no codes');
  assert.ok(FRAMES.every((f) => f[0].startsWith('acts.list.') || f[0].startsWith('acts.tasks.') || f[0].startsWith('acts.shop.') || f[0].startsWith('acts.wallet.')));
  assert.ok(all.filter((w) => w.type === 'w.lang.en.frame' && FRAMES.some((f) => f[0] === one(w, 'name'))).every((w) => one(w, 'needs') === 'entries'));
});

test('list-frames: the keys they set are keys of w.list or w.tasks, with values those allow; what they make or ask about is a word of a kind there', () => {
  const schema = (id) => parse(readFileSync(join(WORLDS_DIR, id, 'schema.sop'), 'utf8'));
  const wires = [...schema('w.list'), ...schema('w.tasks')];
  const slots = wires.filter((w) => w.type === 'core.slot');
  const actionSlots = parse(readFileSync(join(WORLDS_DIR, 'k.actions', 'schema.sop'), 'utf8')).filter((w) => w.type === 'core.slot' && w.attrs.of[0] === 'k.actions.action');
  const vocabulary = ['w.list', 'w.tasks'].flatMap((id) => parse(readFileSync(join(WORLDS_DIR, id, 'shards/words.sop'), 'utf8')));
  const kindWords = new Set(vocabulary.filter((w) => w.type === 'core.word' && wires.some((k) => k.type === 'std.schema.kind' && k.attrs.of[0] === tok(w.attrs.means?.[0]))).flatMap((w) => (w.attrs.text ?? []).map(tok)));
  const fixed = all.filter((w) => w.type === 'w.lang.en.fixed' && FRAMES.some((f) => f[0] === one(w, 'frame')));
  const byFrame = (name) => Object.fromEntries(fixed.filter((x) => one(x, 'frame') === name).map((x) => [one(x, 'role'), one(x, 'value')]));
  let n = 0;
  for (const [name] of FRAMES) {
    const f = byFrame(name);
    if (f.attribute) {
      // money: what a person has, the story state that k.actions money effects change (Q71 (1)), no key of a list
      const s = f.attribute === 'money' ? actionSlots.filter((x) => x.attrs.key[0] === 'money') : slots.filter((x) => x.attrs.key[0] === f.attribute);
      assert.ok(s.length, `${name}: ${f.attribute} is a key of w.list or w.tasks, or k.actions money`);
      if (f.attribute === 'money') { n += 1; continue; }
      if (f.value) assert.ok(s.every((x) => (x.attrs.enum ?? []).includes(f.value)), `${name}: ${f.attribute}=${f.value}`);
      n += 1;
    }
    if (f.thing) { assert.ok(kindWords.has(f.thing), `${name}: "${f.thing}" names a kind of w.list or w.tasks`); n += 1; }
  }
  assert.equal(n, 10); // status (3), money (2), budget; list, reminder (2), task
});

// PSys2's real set (psys2 training/eval/real-2026-11-15.jsonl): the turns Q18 names for K1, K2 and K6, read clause by
// clause (tools/lib/lang-en.mjs clauseReader), each clause with its act, mode and k.actions roles.
export const REAL = {
  r0590: ['i should call grandma', ['make kind=task topic=call grandma']],
  r0598: ['I want a puzzle and I pay 10 lei. What is the change?', ['make kind=puzzle', 'change/less amount=10 lei attribute=money', 'ask/change']],
  r0599: ['I want 2 pencils and I give the cashier 10 lei. How much change do I get?', ['make kind=pencils number=2', 'change/less amount=10 lei attribute=money', 'ask/change']],
  r0622: ["I would like a ball and a pencil and pay with 20 lei. what's the change", ['make kind=ball and a pencil', 'change/less amount=20 lei attribute=money', 'ask/change']],
  r0623: ['how much does a pencil cost?', ['ask/price thing=pencil']],
  r0624: ['I want a puzzle and I pay 10 lei. What is the change?', ['make kind=puzzle', 'change/less amount=10 lei attribute=money', 'ask/change']],
  r0625: ['I want a ball and a pencil and pay with 20 lei what is the change', ['make kind=ball and a pencil', 'change/less amount=20 lei attribute=money', 'ask/change']],
  r0626: ['how much does a ball cost?', ['ask/price thing=ball']],
  r0627: ['I want 2 pencils and I give the cashier 10 lei. How much change do I get?', ['make kind=pencils number=2', 'change/less amount=10 lei attribute=money', 'ask/change']],
};

test('list-frames: the real rows of PSys2 (Q18 K1, K2, K6) read with the right act and roles, clause by clause', () => {
  const real = readFileSync(new URL('../sources/psys2-eval/real-q18.tsv', import.meta.url), 'utf8').trim().split('\n').slice(1).map((l) => l.split('\t'));
  assert.deepEqual(real.map(([id, text]) => [id, text]), Object.entries(REAL).map(([id, [text]]) => [id, text]), 'the rows as PSys2 logged them');
  const right = Object.entries(REAL).filter(([, [text, want]]) => JSON.stringify(readAll(text)) === JSON.stringify(want)).map(([id]) => id);
  console.log(`# real rows read right: ${right.length} of ${Object.keys(REAL).length}: ${right.join(', ')}`);
  for (const [id, [text, want]] of Object.entries(REAL)) assert.deepEqual(readAll(text), want, `${id}: ${text}`);
});

// The sentences of PSys2's kids.shop and kids.tasks worlds (its docs/kids-generalisation-plan.md) that K6 asks frames
// for, with the reading each must have.
const KIDS = [
  ['Add milk to my list.', 'make kind=milk'], ['Add milk to my shopping list.', 'make kind=milk place=shopping'], ['Put bread on my list.', 'make kind=bread'],
  ['Add to my shopping list.', 'make place=shopping'],
  ['Take milk off my list.', 'remove thing=milk'], ['Remove milk from my list.', 'remove thing=milk'],
  ['Does my list have milk?', 'ask/has thing=milk'], ['Is homework on my list?', 'ask/has thing=homework'],
  ['How long is my list?', 'ask/count'], ['Count the stuff on the list.', 'ask/count'],
  ['What lists do I have?', 'ask/all thing=list'], ['Which list names exist?', 'ask/all thing=list'],
  ['What is left to do?', 'ask/open'], ["What's still open for me?", 'ask/open'], ['How many chores remain for us?', 'ask/open'], ['How many things still open?', 'ask/open'],
  ['I just finished my reading.', 'change attribute=status thing=reading value=done'], ['Reading is over for me.', 'change attribute=status thing=reading value=done'],
  ["I didn't finish my homework.", 'change/not attribute=status thing=homework value=open'], ["I didn't buy milk.", 'change/not attribute=status thing=milk value=open'],
  ['Did I finish my homework?', 'ask/done thing=homework'], ['Have I finished my homework?', 'ask/done thing=homework'],
  ['Set a reminder to water the plants.', 'make kind=reminder topic=water the plants'], ['Add a reminder about the dishes.', 'make kind=reminder topic=the dishes'],
  ['How much do 3 pencils cost?', 'ask/price thing=3 pencils'], ['What do 3 pencils cost?', 'ask/price thing=3 pencils'], ['The price of a kite?', null],
  ['Can I buy 3 pencils?', 'ask/afford thing=3 pencils'], ['Is 2 balls affordable?', 'ask/afford thing=2 balls'],
  ['Change for 2 balls with 5 lei?', 'ask/change other=5 lei thing=2 balls'], ['What is the change from 20 lei for a ball and a pencil?', 'ask/change other=20 lei thing=ball and a pencil'],
  ['I start with 30 lei.', 'change attribute=money value=30 lei'], ['My wallet has 15 lei.', 'change attribute=money value=15 lei'], ['My budget is 30 lei.', 'change attribute=budget value=30 lei'],
  ['How much money is left?', 'ask/left'], ['How much money do I have left after I buy 2 pencils?', 'ask/left thing=2 pencils'], ['Show me my cash total.', 'ask/left'],
];

test('list-frames: the sentences of PSys2 kids.shop and kids.tasks that K6 is for read with the right act and roles', () => {
  const wrong = KIDS.filter(([s, want]) => want && JSON.stringify(readAll(s)) !== JSON.stringify([want])).map(([s]) => `${s} -> ${JSON.stringify(readAll(s))}`);
  console.log(`# kids sentences read right: ${KIDS.filter(([, w]) => w).length - wrong.length} of ${KIDS.filter(([, w]) => w).length}`);
  assert.deepEqual(wrong, []);
});

test('list-frames: what is not theirs stays with the general frames, or is not read as a list, a task or a purchase', () => {
  // a request to draw is no purchase; a thing put on a sofa is no list entry; a question about a task is no change
  assert.ok(!clauses('I want to draw a cat.')?.some((c) => c.frame.startsWith('acts.shop.')));
  assert.ok(!clauses('Put the cat on the sofa.')?.some((c) => c.frame.startsWith('acts.list.')));
  assert.deepEqual(clauses('Add a table.').map((c) => c.frame), ['acts.make']);
  assert.notEqual(readAll('Did I finish my homework?')[0].split(' ')[0], 'change');
  // a currency word is needed for money: "I pay 10" is no payment, "I have 3 apples" no money
  assert.ok(!clauses('I pay 10.')?.some((c) => c.frame === 'acts.shop.pay'));
  assert.ok(!clauses('I have 3 apples.')?.some((c) => c.frame === 'acts.wallet.start'));
  // a clause is cut only where every clause reads: "a ball and a pencil" stays one thing
  assert.deepEqual(readAll('I want a ball and a pencil.'), ['make kind=ball and a pencil']);
});
