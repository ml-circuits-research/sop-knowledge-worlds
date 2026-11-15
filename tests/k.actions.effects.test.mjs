// Typed possession effects on k.actions (reviewer block 2026-11-15 09:20, PSys2 Q18 K5; real rows r0194, r0195, r0201,
// r0542): `holds=add|remove|give|set` and `money=add|remove` on the actions a word problem tells (find, get, receive,
// buy, lose, eat, break, give, spend, pay, get back, fly away / leave, hold, have), the free-text `result` kept as the
// gloss. The library's storyState takes its verbs from these: a test builds its verb table from the shards (each action
// and the other forms of its verb) and reads stories with the pinned build, no verb table written by hand.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scanWorlds, factsOf } from '../tools/lib/worlds.mjs';
import { storyState, inflectBy } from '../tools/sopworld/sopworld.mjs';
import { enWorld } from '../tools/lib/lang-en.mjs';

const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const one = (w, k) => tok(w.attrs[k]?.[0]);
const vals = (w, k) => (w.attrs[k] ?? []).map(tok);
const worlds = scanWorlds();
const actions = factsOf('k.actions', 'k.actions.action', worlds);
const forms = factsOf('k.actions', 'core.word', worlds).filter((w) => one(w, 'of') === 'k.actions.action.name');
const effect = new Map(actions.filter((a) => one(a, 'holds') || one(a, 'money')).map((a) => [one(a, 'name'), { holds: one(a, 'holds'), money: one(a, 'money') }]));

const ASKED = { find: 'add', get: 'add', receive: 'add', 'get back': 'add', buy: 'add', lose: 'remove', eat: 'remove', break: 'remove', 'fly away': 'remove', leave: 'remove', give: 'give', hold: 'set', have: 'set' };

test('K5: the actions a word problem tells carry their typed effect; buy, spend and pay move money', () => {
  for (const [verb, holds] of Object.entries(ASKED)) assert.equal(effect.get(verb)?.holds, holds, verb);
  for (const [verb, money] of Object.entries({ buy: 'remove', spend: 'remove', pay: 'remove', sell: 'add' })) assert.equal(effect.get(verb)?.money, money, verb);
  // every effect sits on an action that still says its result in words
  for (const a of actions.filter((x) => effect.has(one(x, 'name')))) assert.ok(one(a, 'result')?.length >= 5, one(a, 'name'));
  console.log(`# ${effect.size} actions with a possession effect: ${[...effect].map(([v, e]) => `${v} ${[e.holds && `holds=${e.holds}`, e.money && `money=${e.money}`].filter(Boolean).join(' ')}`).join(', ')}`);
});

// The verb table of storyState from the catalog: an action's name and its other forms -> its holds effect (or its
// money effect, for a story that counts money: "spends 3 lei").
const verbs = {};
for (const [name, e] of effect) {
  // the forms of a verb are w.lang.en's (KR2, 26ddd3f): the library's inflectBy writes them (third person, past)
  const words = [name, ...['third', 'past'].map((op) => inflectBy(enWorld(), name, op)), ...vals(forms.find((w) => one(w, 'means') === name) ?? { attrs: {} }, 'text')].filter((w) => w && !w.includes(' '));
  for (const w of words) verbs[w] = e.holds ?? e.money;
}
const EN = { verbs, pronouns: ['she', 'he', 'they'], question: ['how', 'many'], all: ['together', 'altogether', 'total'], skip: ['more', 'the', 'a', 'to', 'does', 'do', 'now', 'left', 'in', 'of'] };
const ask = (t) => storyState(t, EN).answers[0]?.answer;

test('K5: storyState reads stories with the verb table taken from k.actions', () => {
  assert.equal(verbs.has, 'set');
  assert.equal(verbs.ate, 'remove');
  assert.equal(verbs.got, 'add');
  assert.equal(ask('Ana has 3 apples. She buys 2 more apples. How many apples does Ana have?'), 5);
  assert.equal(ask('Tom has 5 cookies. He eats 2 cookies. How many cookies does he have left?'), 3);
  assert.equal(ask('Ana has 4 pears. Ana gives 1 pear to Ben. How many pears does Ben have?'), 1);
  assert.equal(ask('Ana has 4 pears. Ana gives 1 pear to Ben. How many pears does Ana have?'), 3);
  assert.equal(ask('Tom has 6 marbles. He loses 2 marbles. He finds 3 marbles. How many marbles does Tom have?'), 7);
  assert.equal(ask('Ana has 2 shells. She gets 4 shells. She receives 1 shell. How many shells does Ana have?'), 7);
  assert.equal(ask('Tom has 10 lei. He spends 3 lei. How many lei does Tom have?'), 7);
  assert.equal(ask('Ana has 3 shells. Ben has 2 shells. How many shells do they have together?'), 5);
});
