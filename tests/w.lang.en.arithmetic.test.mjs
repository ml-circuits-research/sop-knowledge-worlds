// Arithmetic words and frames of w.lang.en (reviewer block 2026-11-15 09:20, PSys2 Q18 K4; real rows r0194, r0195,
// r0201, r0543; shard arithmetic, tools/lang-en-arithmetic.mjs): the words name core.calc builtins, the lexicons the
// frames name are drawn from the words, and the reference frame reader (tools/lib/lang-en.mjs) reads the requests in a
// world whose frames need `calc` (and the general frames) with the act ask in the mode calc and the right roles. Each
// frame's own example is read in tests/w.lang.en.frames.test.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from '../tools/sopworld/sopworld.mjs';
import { WORLDS_DIR } from '../tools/lib/worlds.mjs';
import { frameReader } from '../tools/lib/lang-en.mjs';
import { arithmeticShard, WORDS, LEXICONS, FRAMES } from '../tools/lang-en-arithmetic.mjs';

const shardsOf = (id) => readdirSync(join(WORLDS_DIR, id, 'shards')).filter((f) => f.endsWith('.sop')).sort().flatMap((f) => parse(readFileSync(join(WORLDS_DIR, id, 'shards', f), 'utf8')));
const all = shardsOf('w.lang.en'), actions = shardsOf('k.actions');
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const one = (w, k) => tok(w.attrs[k]?.[0]);
const vals = (w, k) => (w.attrs[k] ?? []).map(tok);
const calc = all.filter((w) => w.type === 'w.lang.en.calc');

test('arithmetic: the shard is what tools/lang-en-arithmetic.mjs gives; every frame needs calc', () => {
  assert.equal(readFileSync(join(WORLDS_DIR, 'w.lang.en', 'shards', 'arithmetic.sop'), 'utf8'), arithmeticShard());
  assert.equal(calc.length, WORDS.length);
  const frames = all.filter((w) => w.type === 'w.lang.en.frame' && FRAMES.some((f) => f[0] === one(w, 'name')));
  assert.equal(frames.length, FRAMES.length);
  assert.ok(frames.every((f) => one(f, 'needs') === 'calc' && one(f, 'act') === 'ask' && one(f, 'mode') === 'calc'));
});

test('arithmetic: the words name core.calc builtins of the pinned build; the lexicons are drawn from the words', () => {
  const src = readFileSync(join(WORLDS_DIR, '..', '..', 'tools', 'sopworld', 'sopworld.mjs'), 'utf8');
  for (const fn of new Set(calc.map((w) => one(w, 'calc')).filter(Boolean))) assert.match(src, new RegExp(`\\b${fn}\\b`), fn);
  // operators and comparisons name a function; states name a state, no function
  for (const w of calc) {
    if (['operator', 'comparison', 'aggregate', 'extreme'].includes(one(w, 'kind'))) assert.ok(one(w, 'calc'), one(w, 'text'));
    if (one(w, 'kind') === 'state') assert.ok(['now', 'start'].includes(one(w, 'state')), one(w, 'text'));
    if (one(w, 'form') === 'split') assert.ok(vals(w, 'marker').length, one(w, 'text'));
  }
  for (const [name, { items }] of Object.entries(LEXICONS)) {
    const lex = all.find((w) => w.type === 'w.lang.en.lex' && one(w, 'name') === name);
    assert.deepEqual(vals(lex, 'item'), items, name);
    if (name === 'calc.marker') continue;
    for (const i of items) assert.ok(calc.some((w) => one(w, 'text') === i), `${name}: ${i}`);
  }
  assert.equal(calc.find((w) => one(w, 'text') === 'double').attrs.factor[0], '2');
  assert.equal(one(calc.find((w) => one(w, 'text') === 'at first'), 'state'), 'start');
});

const read = frameReader(all, actions, { needs: (n) => n === undefined || n === 'calc' });
const said = (s) => { const r = read(s)[0]; return r ? `${r.act}/${r.mode ?? ''} ${Object.entries(r.args).sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, v]) => `${k}=${v}`).join(' ')}` : null; };
// [request, reading]
const CASES = [
  ['What is 3 plus 4?', 'ask/calc other=4 thing=3 topic=plus'],
  ['what is 10 divided by 2', 'ask/calc other=2 thing=10 topic=divided by'],
  ['What is 3 times 4', 'ask/calc other=4 thing=3 topic=times'],
  ['what is twelve minus five', 'ask/calc other=five thing=twelve topic=minus'],
  ['What is double 6?', 'ask/calc thing=6 topic=double'],
  ['what is half of 10', 'ask/calc thing=10 topic=half of'],
  ['Share 12 between 3.', 'ask/calc other=3 thing=12 topic=share'],
  ['Share 12 sweets between 3 children.', 'ask/calc other=3 children thing=12 sweets topic=share'],
  ['Subtract 4 from 10.', 'ask/calc other=10 thing=4 topic=subtract'],
  ['How many apples does Tom have?', 'ask/calc place=tom thing=apples'],
  ['How many apples does Tom have left?', 'ask/calc place=tom thing=apples topic=left'],
  ['How many apples does he have now?', 'ask/calc place=he thing=apples topic=now'],
  ['How many apples did Tom have at first?', 'ask/calc place=tom thing=apples topic=at first'],
  ['How many apples are there altogether?', 'ask/calc thing=apples topic=altogether'],
  ['How many apples do Tom and Ana have in total?', 'ask/calc other=ana place=tom thing=apples topic=in total'],
  ['Who has the most apples?', 'ask/calc thing=apples topic=the most'],
  ['Who has the fewest sweets?', 'ask/calc thing=sweets topic=the fewest'],
  ['How many more apples does Ana have than Tom?', 'ask/calc other=tom place=ana thing=apples topic=more'],
  ['How many fewer pears does Tom have than Ana?', 'ask/calc other=ana place=tom thing=pears topic=fewer'],
];

test('arithmetic: the requests read with the act ask in the mode calc and their roles', () => {
  const wrong = CASES.map(([s, want]) => [s, want, said(s)]).filter(([, want, got]) => want !== got);
  console.log(`# ${CASES.length - wrong.length} of ${CASES.length} requests read as said`);
  assert.deepEqual(wrong, []);
});

test('arithmetic: a world without calc reads none of them as calc (the frames compete only where they are needed)', () => {
  const general = frameReader(all, actions, { needs: (n) => n === undefined });
  for (const [s] of CASES) assert.ok(!general(s).some((r) => r.mode === 'calc'), s);
});
