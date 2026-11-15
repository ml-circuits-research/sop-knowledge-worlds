// Frames for lists, tasks, a shop and a wallet (reviewer block 2026-11-15 09:20, PSys2 Q18 K6), in w.lang.en's frame
// format, bound to the acts and keys of the world schemas w.list (K1) and w.tasks (K2):
//  - lists: "add X to my (shopping) list", "put X on my list" (make: the entry X, the list its place), "take X off my
//    list", "remove X from my list" (remove), "does my list have X", "is X on my list" (ask, mode has), "how long is my
//    list" (ask, mode count), "which lists do I have" (ask, mode all, the thing a list);
//  - tasks: "what is left to do", "what's still open" (ask, mode open: the tasks whose status is open), "I (just)
//    finished X" (change: status done), "X is done" (the same), "I didn't finish X" (change in the mode not: status
//    open), "set a reminder to X", "remind me to X" (make: a reminder, X its topic), "I should X" (make: a task, X its
//    topic; real row r0590 "i should call grandma");
//  - shop: "how much do N X cost", "what is the price of X" (ask, mode price), "can I buy N X", "is N X affordable" (ask,
//    mode afford), "what is the change", "how much change do I get" (ask, mode change), "change from N lei for X and Y"
//    (ask, mode change: the money paid is the other amount the price is taken from), "I want X" (make: X goes on the
//    shopping list), "I pay N lei", "I give the cashier N lei" (change: the list's tendered);
//  - wallet: "I start with N lei", "my wallet has N lei" (change: the list's budget), "how much money is left" (ask,
//    mode left).
// Every frame `needs=entries`: a world with lists of entries that have a status, a quantity and a price (w.list,
// w.tasks); so the frames compete with each other and with the general frames, never with those of other worlds.
// The keys a frame sets (`w.lang.en.fixed`: attribute status, tendered, budget) are keys of w.list and w.tasks, and a
// test checks they are. The lexicon of money words (money.unit) is derived from k.units (the everyday unit, its plural,
// the minor unit and the core.word texts of each currency, codes and signs left out), so it cannot disagree with k.units;
// `npm run build` reruns this tool.
//   node tools/lang-en-list-frames.mjs     writes docs/worlds/w.lang.en/shards/list-frames.sop
// Deterministic: input k.units's shards. tests/w.lang.en.list-frames.test.mjs reads every request back.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from './sopworld/sopworld.mjs';
import { WORLDS_DIR } from './lib/worlds.mjs';
import { wire, header, text } from './import/lib.mjs';
import { frameLines, rolesOf } from './lang-en-role-frames.mjs';

const SRC = 'hand-core 1';
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const one = (w, k) => tok(w.attrs[k]?.[0]);
const vals = (w, k) => (w.attrs[k] ?? []).map(tok);

// The money words of k.units: the everyday unit and its plural, the name and its plural, the minor unit and its
// plural, and the core.word texts of a currency, lower case; codes (RON) and signs ($) are no words a reader takes here.
export function moneyWords() {
  const dir = join(WORLDS_DIR, 'k.units', 'shards');
  const wires = readdirSync(dir).filter((f) => f.endsWith('.sop')).sort().flatMap((f) => parse(readFileSync(join(dir, f), 'utf8')));
  const out = new Set();
  for (const w of wires) {
    const xs = w.type === 'k.units.currency' ? ['unit', 'unit_plural', 'name', 'name_plural', 'minor', 'minor_plural'].flatMap((k) => vals(w, k))
      : w.type === 'core.word' && one(w, 'of') === 'k.units.currency.code' ? vals(w, 'text') : [];
    for (const x of xs) if (/^[A-Za-z][A-Za-z ]*[a-z]$/.test(x) && !/^[A-Z]{3}$/.test(x)) out.add(x.toLowerCase());
  }
  return [...out].sort();
}

const lead = ['lead'], det = ['det'];
const role = (r, takes = 'words', more = {}) => ['role', r, takes, more];
const word = (words, optional = false) => ['word', words, optional];
const my = word(['my', 'the', 'our', 'this', 'that'], true);
const listNoun = word(['list', 'lists']);
const listName = role('place', 'words', { optional: true, max: 3 }); // the list's name before "list" (shopping, to-do)
const money = (r) => [role(r, 'number'), role(r === 'value' ? 'currency' : 'unit', 'lexicon', { lexicon: 'money.unit' })];
const subject = word(['i', 'we'], true);
const wants = word(['i want', 'i would like', 'id like', 'i will take', 'ill take', 'i will have', 'ill have', 'i want to buy', 'i would like to buy', 'i need', 'i buy', 'i am buying', 'im buying', 'give me']);
const tail = word(['for me', 'for us', 'today', 'now', 'please', 'yet'], true);

// [name, act, mode, priority, example, parts, fixed, why]
export const FRAMES = [
  // ---- lists (w.list) ----
  ['acts.list.add', 'make', undefined, 14, 'Add milk to my shopping list.',
    [lead, word(['add', 'write', 'write down', 'jot down', 'note down', 'include']), role('amount', 'number', { optional: true }), det, role('thing'), word(['to', 'onto', 'in', 'into']), my, listName, listNoun], {},
    'the entry made is the thing (make: kind), the list its place'],
  ['acts.list.add.bare', 'make', undefined, 13, 'Add to my shopping list.',
    [lead, word(['add', 'add something', 'add an item', 'add a thing', 'put something', 'write something']), word(['to', 'onto', 'on']), my, listName, listNoun], {},
    'an entry with nothing said: the host asks what'],
  ['acts.list.put', 'make', undefined, 14, 'Put bread on my list.',
    [lead, word(['put', 'stick', 'pop', 'write', 'place']), role('amount', 'number', { optional: true }), det, role('thing'), word(['on', 'onto', 'in']), my, listName, listNoun], {}, null],
  ['acts.list.off', 'remove', undefined, 14, 'Take milk off my list.',
    [lead, word(['take', 'cross', 'strike', 'scratch', 'get']), det, role('thing'), word(['off', 'out of', 'from']), my, role('place', 'words', { optional: true, max: 3 }), listNoun], {}, null],
  ['acts.list.remove', 'remove', undefined, 14, 'Remove milk from my list.',
    [lead, word(['remove', 'delete', 'drop', 'erase', 'cross off', 'take off', 'scratch off', 'strike off']), det, role('thing'), word(['from', 'off']), my, role('place', 'words', { optional: true, max: 3 }), listNoun], {}, null],
  ['acts.list.has', 'ask', 'has', 14, 'Does my list have milk?',
    [word(['does', 'do']), my, listName, listNoun, word(['have', 'include', 'contain', 'say', 'have got', 'list']), det, role('thing')], {}, null],
  ['acts.list.has.on', 'ask', 'has', 14, 'Is milk on my list?',
    [word(['is', 'are', 'have i got', 'have i put', 'did i put', 'did i add']), det, role('thing'), word(['on', 'in']), my, listName, listNoun], {}, null],
  ['acts.list.count', 'ask', 'count', 14, 'How long is my list?',
    [word(['how long is', 'how big is', 'how full is']), my, listName, listNoun], {}, null],
  ['acts.list.count.many', 'ask', 'count', 14, 'How many things are on my list?',
    [word(['how many things are', 'how many items are', 'how many things', 'how many items', 'how much stuff is', 'count the things', 'count the items', 'count the stuff']), word(['on', 'in']), my, listName, listNoun], {}, null],
  ['acts.list.which', 'ask', 'all', 14, 'Which lists do I have?',
    [word(['which lists do i have', 'what lists do i have', 'which lists have i got', 'what lists have i got', 'which lists are there', 'what lists are there', 'which list names exist', 'what are my lists', 'show me my lists', 'show my lists', 'list my lists'])], { thing: 'list' },
    'the thing asked about is the lists themselves'],
  // ---- tasks (w.tasks) ----
  ['acts.tasks.open', 'ask', 'open', 14, 'What is left to do?',
    [word(['what is left to do', 'whats left to do', 'what is there left to do', 'what do i still have to do', 'what do i still need to do', 'what do we still have to do', 'what is still to do', 'what else is there to do', 'what remains to be done', 'what is left on my list', 'whats left on my list', 'how many chores remain', 'how many things still open', 'how many tasks are left']), tail], {}, null],
  ['acts.tasks.open.still', 'ask', 'open', 14, "What's still open?",
    [word(['whats still open', 'what is still open', 'whats open', 'what is open', 'which tasks are open', 'what tasks are open', 'which tasks are still open', 'what is not done', 'whats not done', 'what is not done yet', 'whats not done yet', 'what have i not done', 'what havent i done']), tail], {}, null],
  ['acts.tasks.done', 'change', undefined, 14, 'I just finished my reading.',
    [word(['i', 'we', 'ive', 'weve']), word(['just', 'have', 'have just', 'already', 'have already'], true), word(['finished', 'completed', 'did', 'done', 'ticked off', 'crossed off', 'got through']), det, role('thing'), tail], { attribute: 'status', value: 'done' },
    'status done: the state the act change sets (the subject is said: "did I finish" is a question)'],
  ['acts.tasks.done.ask', 'ask', 'done', 14, 'Have I finished my homework?',
    [word(['did i', 'have i', 'did we', 'have we', 'has', 'did']), word(['finish', 'finished', 'complete', 'completed', 'do', 'done', 'buy', 'bought']), det, role('thing'), word(['yet', 'already'], true)], {},
    'whether a task is done: its status'],
  ['acts.tasks.done.is', 'change', undefined, 13, 'My homework is done.',
    [det, role('thing'), word(['is done', 'is finished', 'is over', 'is complete', 'is completed', 'are done', 'are finished', 'are over']), tail], { attribute: 'status', value: 'done' }, null],
  ['acts.tasks.not.done', 'change', 'not', 15, "I didn't finish my homework.",
    [subject, word(['didnt', 'did not', 'havent', 'have not', 'still havent', 'still have not', 'never']), word(['finish', 'finished', 'complete', 'completed', 'do', 'done', 'buy', 'bought', 'get', 'got']), det, role('thing'), tail], { attribute: 'status', value: 'open' },
    'negated: the task stays open (status open), nothing is ticked off'],
  ['acts.tasks.reminder', 'make', undefined, 14, 'Set a reminder to water the plants.',
    [lead, word(['set', 'add', 'make', 'create', 'put in', 'give me']), word(['a reminder', 'reminder', 'an alarm', 'a note']), word(['to', 'about', 'for', 'that i should', 'that i need to']), role('topic', 'rest')], { thing: 'reminder' },
    'a task with a reminder; what it is about is its topic'],
  ['acts.tasks.remind', 'make', undefined, 14, 'Remind me to water the plants.',
    [lead, word(['remind me to', 'remind me about', 'remind us to', 'dont let me forget to', 'do not let me forget to', 'dont let me forget about']), role('topic', 'rest')], { thing: 'reminder' }, null],
  ['acts.tasks.should', 'make', undefined, 12, 'I should call grandma.',
    [word(['i should', 'i need to', 'i have to', 'i must', 'i ought to', 'i gotta', 'i got to', 'i still have to', 'i still need to', 'we should', 'we need to', 'we have to', 'remember to', 'dont forget to']), role('topic', 'rest')], { thing: 'task' },
    'a task said as something one should do (PSys2 real row r0590)'],
  // ---- shop (w.list: price, tendered) ----
  ['acts.shop.price', 'ask', 'price', 14, 'How much do 3 pencils cost?',
    [word(['how much do', 'how much does', 'what do', 'what does', 'how much will', 'what will']), det, role('thing'), word(['cost', 'costs', 'come to'])], {}, 'the number stays in the thing (3 pencils): ask has no number role'],
  ['acts.shop.price.of', 'ask', 'price', 14, 'What is the price of a kite?',
    [word(['what is the price of', 'whats the price of', 'what is the cost of', 'whats the cost of', 'how much is', 'how much are', 'how much for', 'what price is', 'what price are']), det, role('thing')], {}, null],
  ['acts.shop.afford', 'ask', 'afford', 14, 'Can I buy 3 pencils?',
    [word(['can i buy', 'could i buy', 'can i afford', 'could i afford', 'can we buy', 'can we afford', 'do i have enough money for', 'do i have enough for', 'is there enough money for', 'have i got enough for']), det, role('thing')], {}, null],
  ['acts.shop.afford.is', 'ask', 'afford', 14, 'Is 2 balls affordable?',
    [word(['is', 'are']), det, role('thing'), word(['affordable', 'within my budget', 'in my budget'])], {}, null],
  ['acts.shop.change', 'ask', 'change', 14, 'What is the change?',
    [word(['what is the change', 'whats the change', 'what is my change', 'whats my change', 'how much change do i get', 'how much change will i get', 'how much change', 'what change do i get', 'what is the change i get', 'how much do i get back', 'what do i get back']), word(['back', 'in return'], true)], {}, null],
  ['acts.shop.change.from', 'ask', 'change', 15, 'What is the change from 20 lei for a ball and a pencil?',
    [word(['what is the change', 'whats the change', 'how much change do i get', 'how much change', 'change', 'the change']), word(['from', 'out of', 'with']), ...money('money'), word(['for']), det, role('thing')], {},
    'the money paid is the other amount, the one the price of the things is taken from (ask: other)'],
  ['acts.shop.change.for', 'ask', 'change', 15, 'Change for 2 balls with 5 lei?',
    [word(['what is the change', 'whats the change', 'how much change do i get', 'how much change', 'change', 'the change']), word(['for']), det, role('thing'), word(['with', 'from', 'out of', 'if i pay', 'if i give']), ...money('money')], {}, null],
  ['acts.shop.want', 'make', undefined, 13, 'I want a puzzle.',
    [wants, word(['a', 'an', 'the', 'some', 'another', 'one']), role('thing'), tail], {},
    'what a customer asks for goes on the shopping list (make: kind); an article or a number says a thing follows ("I want to draw" is no purchase)'],
  ['acts.shop.want.n', 'make', undefined, 13, 'I want 2 pencils.',
    [wants, role('amount', 'number'), role('thing'), tail], {}, null],
  ['acts.shop.pay', 'change', undefined, 14, 'I pay 10 lei.',
    [subject, word(['pay', 'paid', 'pay with', 'paid with', 'give', 'gave', 'give the cashier', 'gave the cashier', 'give the shopkeeper', 'gave the shopkeeper', 'hand over', 'handed over', 'hand the cashier', 'handed the cashier', 'have to pay']), ...money('value')], { attribute: 'tendered' },
    'the money handed over at the till: the list\'s tendered'],
  // ---- wallet (w.list: budget) ----
  ['acts.wallet.start', 'change', undefined, 14, 'I start with 30 lei.',
    [word(['i start with', 'i started with', 'i begin with', 'i began with', 'we start with', 'i have', 'i have got', 'ive got', 'i got', 'my wallet has', 'in my wallet i have', 'my wallet holds', 'there are', 'my budget is']), ...money('value'), word(['in my wallet', 'in my pocket', 'to spend'], true)], { attribute: 'budget' },
    'the money there is to spend: the list\'s budget'],
  ['acts.wallet.left', 'ask', 'left', 14, 'How much money is left?',
    [word(['how much money is left', 'how much money do i have left', 'how much money have i got left', 'how much is left', 'how much do i have left', 'how much have i got left', 'what money is left', 'how much money remains', 'how much money do i have', 'show me my cash total', 'whats my cash total', 'what is my cash total']), word(['after i buy', 'after buying', 'if i buy'], true), role('thing', 'words', { optional: true }), tail], {}, null],
];
// Role maps (frame role -> k.actions role): the money word goes with the number into the value set, or into the
// other amount of an ask (the money paid, from which the price is taken).
export const ROLE_MAPS = [
  ['list.change.currency', 'change', 'currency', 'value', 'The currency word goes with the number: "I pay 10 lei": the value 10 lei'],
  ['list.ask.money', 'ask', 'money', 'other', 'The money paid in a question of change: "the change from 20 lei for a ball": 20 lei is the other amount'],
  ['list.ask.unit', 'ask', 'unit', 'other', 'The currency word of the money paid: "from 20 lei": lei'],
];

export function lexiconWires() {
  return [wire('w.lang.en.lex.money.unit', 'w.lang.en.lex', [['name', 'money.unit'], ['doc', text('Words for money after a number ("10 lei", "5 dollars", "50 cents"): the everyday unit, its plural, the name and the minor unit of each k.units currency and its core.word texts, lower case, codes and signs left out; derived by tools/lang-en-list-frames.mjs.')], ...moneyWords().map((x) => ['item', text(x)])], SRC)];
}

export function listFrameShard() {
  const lines = [];
  for (const [name, act, mode, priority, example, parts, fixed, why] of FRAMES) {
    const fl = frameLines(name, { act, mode, set: 'acts', priority, needs: 'entries', roles: rolesOf(parts), example }, parts, fixed);
    lines.push(...(why ? [`# ${name}: ${why}`] : []), ...fl);
  }
  const maps = ROLE_MAPS.map(([n, act, r, actRole, doc]) => wire(`w.lang.en.role_map.${n}`, 'w.lang.en.role_map', [['name', n], ['act', act], ['role', r], ['act_role', actRole], ['doc', text(doc)]], SRC));
  return `${header({ id: 'w.lang.en/shards/list-frames', about: `frames for lists, tasks, a shop and a wallet (reviewer block 2026-11-15 09:20, PSys2 Q18 K6): ${FRAMES.length} frames bound to the acts and keys of the world schemas w.list and w.tasks ("add milk to my shopping list", "what is left to do", "I finished my homework", "how much do 3 pencils cost", "what is the change", "I start with 30 lei"), all with needs=entries; their role maps; and the lexicon of money words, derived from k.units.`,
    sources: ['hand-core 1 (written in this repository, own: tools/lang-en-list-frames.mjs; the money words derived from k.units, whose currencies come from CLDR 48 and hand-core 1)'], license: 'CC0-1.0', script: 'tools/lang-en-list-frames.mjs' })}\n${lines.join('\n')}\n\n# Role maps of these frames.\n${maps.join('\n')}\n\n# The lexicon of money words, derived from k.units.\n${lexiconWires().join('\n')}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const t = listFrameShard();
  writeFileSync(join(WORLDS_DIR, 'w.lang.en', 'shards', 'list-frames.sop'), t);
  console.log(`list-frames.sop: ${FRAMES.length} frames, ${t.split('\n').filter((l) => l.startsWith('@')).length} wires, ${Buffer.byteLength(t)} bytes`);
}
