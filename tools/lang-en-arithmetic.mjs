// Arithmetic words and frames (reviewer block 2026-11-15 09:20, PSys2 Q18 K4; real rows r0194, r0195, r0201, r0543), in
// w.lang.en's formats, own shard `arithmetic`:
//  - words (`w.lang.en.calc`): each word or phrase of arithmetic with the core.calc function it names (the library's
//    builtins: add, sub, mul, div, eq, sum, argmax, argmin) and how it is said:
//      operators: infix ("3 plus 4", "10 divided by 2"), prefix with a factor ("double 6", "half of 10"), split ("share
//      12 between 3": the marker between or among);
//      comparisons, a relation between two quantities ("3 more than Tom": Tom's add 3; "twice as many as": mul 2);
//      aggregates ("in total", "altogether": sum), extremes ("the most": argmax), and the states of a story's quantity
//      ("left", "now": the quantity now; "at first", "to begin with": the quantity at the start, an unknown to solve);
//  - frames (`needs=calc`: a world that holds quantities of things per owner, a story state or a calculator; they compete
//    with each other and the general frames only): "what is N op M", "what is double N", "share N between M", "how many
//    X does O have (now / left / at first / in total)", "who has the most X", "how many more X does A have than B",
//    "how many X are there altogether". Every frame is the act ask in the mode calc; the operator, the comparison word or
//    the state is a lexicon role whose words are the `w.lang.en.calc` facts of its kind, so the lexicons cannot disagree
//    with the words (a test).
// The words of a story's verbs (has, gives, eats, buys) are k.actions actions with their typed possession effects
// (`holds=`, `money=`, K5), not here; the number words are w.lang.en.number and w.lang.en.numeral.
//   node tools/lang-en-arithmetic.mjs     writes docs/worlds/w.lang.en/shards/arithmetic.sop
// Deterministic, no input. tests/w.lang.en.arithmetic.test.mjs reads every request back.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR } from './lib/worlds.mjs';
import { wire, header, text } from './import/lib.mjs';
import { frameLines, rolesOf } from './lang-en-role-frames.mjs';

const SRC = 'hand-core 1';

// [text, kind, form, calc, factor, markers, state, example]
export const WORDS = [
  // ---- operators, infix: N op M
  ['plus', 'operator', 'infix', 'add', null, [], null, 'What is 3 plus 4?'],
  ['add', 'operator', 'split', 'add', null, ['to', 'and'], null, 'Add 3 to 4.'],
  ['added to', 'operator', 'infix', 'add', null, [], null, 'What is 3 added to 4?'],
  ['and', 'operator', 'infix', 'add', null, [], null, 'What do 3 and 4 make?'],
  ['minus', 'operator', 'infix', 'sub', null, [], null, 'What is 10 minus 4?'],
  ['take away', 'operator', 'infix', 'sub', null, [], null, 'What is 10 take away 4?'],
  ['less', 'operator', 'infix', 'sub', null, [], null, 'What is 10 less 4?'],
  ['subtract', 'operator', 'split', 'sub', null, ['from'], null, 'Subtract 4 from 10.'],
  ['times', 'operator', 'infix', 'mul', null, [], null, 'What is 3 times 4?'],
  ['multiplied by', 'operator', 'infix', 'mul', null, [], null, 'What is 3 multiplied by 4?'],
  ['multiply', 'operator', 'split', 'mul', null, ['by'], null, 'Multiply 3 by 4.'],
  ['divided by', 'operator', 'infix', 'div', null, [], null, 'What is 12 divided by 3?'],
  ['divide', 'operator', 'split', 'div', null, ['by', 'between', 'among', 'into'], null, 'Divide 12 by 3.'],
  ['share', 'operator', 'split', 'div', null, ['between', 'among', 'by'], null, 'Share 12 between 3.'],
  ['split', 'operator', 'split', 'div', null, ['between', 'among', 'into'], null, 'Split 12 between 3.'],
  // ---- operators, prefix with a factor: op N
  ['double', 'operator', 'prefix', 'mul', 2, [], null, 'What is double 6?'],
  ['twice', 'operator', 'prefix', 'mul', 2, [], null, 'What is twice 6?'],
  ['triple', 'operator', 'prefix', 'mul', 3, [], null, 'What is triple 4?'],
  ['half', 'operator', 'prefix', 'mul', 0.5, [], null, 'What is half 10?'],
  ['half of', 'operator', 'prefix', 'mul', 0.5, [], null, 'What is half of 10?'],
  ['a quarter of', 'operator', 'prefix', 'mul', 0.25, [], null, 'What is a quarter of 12?'],
  // ---- comparisons: N word M sets one quantity from another (M op N, or M times the factor)
  ['more than', 'comparison', 'relation', 'add', null, [], null, 'Ana has 3 more apples than Tom.'],
  ['fewer than', 'comparison', 'relation', 'sub', null, [], null, 'Ana has 2 fewer apples than Tom.'],
  ['less than', 'comparison', 'relation', 'sub', null, [], null, 'Ana has 2 less money than Tom.'],
  ['times as many as', 'comparison', 'relation', 'mul', null, [], null, 'Ana has 3 times as many apples as Tom.'],
  ['times as much as', 'comparison', 'relation', 'mul', null, [], null, 'Ana has 3 times as much money as Tom.'],
  ['twice as many as', 'comparison', 'relation', 'mul', 2, [], null, 'Ana has twice as many apples as Tom.'],
  ['twice as much as', 'comparison', 'relation', 'mul', 2, [], null, 'Ana has twice as much money as Tom.'],
  ['half as many as', 'comparison', 'relation', 'mul', 0.5, [], null, 'Ana has half as many apples as Tom.'],
  ['as many as', 'comparison', 'relation', 'eq', null, [], null, 'Ana has as many apples as Tom.'],
  // ---- comparative words of a question ("how many more")
  ['more', 'comparison', 'question', 'sub', null, [], null, 'How many more apples does Ana have than Tom?'],
  ['fewer', 'comparison', 'question', 'sub', null, [], null, 'How many fewer apples does Tom have than Ana?'],
  ['less', 'comparison', 'question', 'sub', null, [], null, 'How much less money does Tom have than Ana?'],
  // ---- aggregates
  ['in total', 'aggregate', null, 'sum', null, [], null, 'How many apples do they have in total?'],
  ['altogether', 'aggregate', null, 'sum', null, [], null, 'How many apples are there altogether?'],
  ['all together', 'aggregate', null, 'sum', null, [], null, 'How many apples do they have all together?'],
  ['in all', 'aggregate', null, 'sum', null, [], null, 'How many apples are there in all?'],
  ['together', 'aggregate', null, 'sum', null, [], null, 'How many apples do they have together?'],
  // ---- extremes
  ['the most', 'extreme', null, 'argmax', null, [], null, 'Who has the most apples?'],
  ['the fewest', 'extreme', null, 'argmin', null, [], null, 'Who has the fewest apples?'],
  ['the least', 'extreme', null, 'argmin', null, [], null, 'Who has the least money?'],
  // ---- states of a story's quantity
  ['left', 'state', null, null, null, [], 'now', 'How many apples does Tom have left?'],
  ['now', 'state', null, null, null, [], 'now', 'How many apples does Tom have now?'],
  ['at first', 'state', null, null, null, [], 'start', 'How many apples did Tom have at first?'],
  ['at the start', 'state', null, null, null, [], 'start', 'How many apples did Tom have at the start?'],
  ['to begin with', 'state', null, null, null, [], 'start', 'How many apples did Tom have to begin with?'],
  ['to start with', 'state', null, null, null, [], 'start', 'How many apples did Tom have to start with?'],
  ['in the beginning', 'state', null, null, null, [], 'start', 'How many apples did Tom have in the beginning?'],
];

// The lexicons the frames name, from the words above (by kind and form): the reader takes an operator by its words.
const words = (pred) => [...new Set(WORDS.filter(pred).map((w) => w[0]))].sort();
export const LEXICONS = {
  'calc.infix': { doc: 'Arithmetic operators said between two numbers ("3 plus 4"): the w.lang.en.calc words of kind operator, form infix.', items: words((w) => w[1] === 'operator' && w[2] === 'infix') },
  'calc.prefix': { doc: 'Arithmetic operators said before one number, with a factor ("double 6", "half of 10"): kind operator, form prefix.', items: words((w) => w[1] === 'operator' && w[2] === 'prefix') },
  'calc.split': { doc: 'Arithmetic verbs said around two numbers with a marker ("share 12 between 3", "subtract 4 from 10"): kind operator, form split.', items: words((w) => w[1] === 'operator' && w[2] === 'split') },
  'calc.marker': { doc: 'The markers of the split operators ("between", "from", "by"): the markers of the w.lang.en.calc words of form split.', items: [...new Set(WORDS.flatMap((w) => w[5]))].sort() },
  'calc.comparative': { doc: 'Comparative words of a question ("how many more"): kind comparison, form question.', items: words((w) => w[1] === 'comparison' && w[2] === 'question') },
  'calc.aggregate': { doc: 'Words that ask for the sum of every owner\'s quantity ("in total", "altogether"): kind aggregate.', items: words((w) => w[1] === 'aggregate') },
  'calc.extreme': { doc: 'Words that ask for the owner with the largest or smallest quantity ("the most"): kind extreme.', items: words((w) => w[1] === 'extreme') },
  'calc.state': { doc: 'Words that say which state of a story\'s quantity a question asks for ("left", "at first"): kind state.', items: words((w) => w[1] === 'state') },
};

const lead = ['lead'], det = ['det'];
const role = (r, takes = 'words', more = {}) => ['role', r, takes, more];
const word = (ws, optional = false) => ['word', ws, optional];
const lex = (r, name, more = {}) => role(r, 'lexicon', { lexicon: name, ...more });
const thing = role('thing', 'words', { max: 3 });
const owner = role('owner', 'words', { max: 2 });
const howMany = word(['how many', 'how much']);
const tell = word(['what is', 'whats', 'what are', 'how much is', 'calculate', 'work out', 'tell me', 'what do', 'what does', 'can you tell me', 'do you know'], true);
const makes = word(['make', 'makes', 'equal', 'equals', 'give', 'come to', 'is'], true);
const have = word(['have', 'has', 'own', 'hold', 'get', 'have got', 'keep']);
const did = word(['does', 'do', 'did']);

// [name, priority, example, parts, why]
export const FRAMES = [
  ['acts.calc.infix', 15, 'What is 3 plus 4?',
    [tell, role('number', 'number'), lex('op', 'calc.infix'), role('other', 'number'), makes], 'two numbers and an operator between them'],
  ['acts.calc.prefix', 15, 'What is double 6?',
    [tell, lex('op', 'calc.prefix'), role('number', 'number')], 'an operator with a factor before one number'],
  ['acts.calc.split', 15, 'Share 12 between 3.',
    [lead, lex('op', 'calc.split'), role('number', 'number'), role('thing', 'words', { max: 3, optional: true }), word(LEXICONS['calc.marker'].items), role('other', 'number'), role('among', 'words', { optional: true, max: 2 })],
    'a verb of arithmetic around two numbers: "share 12 sweets between 3 children"; what is shared is the thing, among whom is said after the second number'],
  ['acts.calc.has', 15, 'How many apples does Tom have?',
    [howMany, thing, did, owner, have, lex('state', 'calc.state', { optional: true })], 'the quantity an owner holds, now, left or at first'],
  ['acts.calc.has.state', 15, 'How many apples did Tom have at first?',
    [howMany, thing, did, owner, word(['have', 'own', 'hold', 'start with', 'begin with']), lex('state', 'calc.state')], 'the quantity at the start: an unknown a story solves'],
  ['acts.calc.total', 15, 'How many apples are there altogether?',
    [howMany, thing, word(['are there', 'is there', 'do they have', 'do they have got', 'did they have', 'have they got', 'do we have', 'do you have', 'do the children have', 'are', 'is']), lex('aggregate', 'calc.aggregate')], 'the sum over every owner'],
  ['acts.calc.total.owners', 14, 'How many apples do Tom and Ana have in total?',
    [howMany, thing, did, owner, word(['and']), role('other', 'words', { max: 2 }), have, lex('aggregate', 'calc.aggregate', { optional: true })], 'the sum of two owners'],
  ['acts.calc.most', 15, 'Who has the most apples?',
    [word(['who has', 'who had', 'who has got', 'whos got', 'which of them has', 'which one has', 'who owns', 'who holds']), lex('extreme', 'calc.extreme'), thing], 'the owner with the largest or smallest quantity'],
  ['acts.calc.more', 15, 'How many more apples does Ana have than Tom?',
    [howMany, lex('compare', 'calc.comparative'), thing, did, owner, have, word(['than']), role('other', 'words', { max: 2 }), word(['does', 'do', 'has', 'have', 'did'], true)], 'the difference between two owners\' quantities'],
];

// Role maps (frame role -> role of the act ask): the first number or the owner asked about is the thing's holder (place:
// where to look), the second number or owner the other, what it is said about the topic.
export const ROLE_MAPS = [
  ['calc.ask.number', 'number', 'thing', 'The first number of a calculation ("3 plus 4": 3)'],
  ['calc.ask.owner', 'owner', 'place', 'Whose quantity is asked about ("how many apples does Tom have": Tom, where to look)'],
  ['calc.ask.op', 'op', 'topic', 'The operator a calculation is about ("plus"); its w.lang.en.calc fact names the core.calc function'],
  ['calc.ask.among', 'among', 'other', 'Among whom a quantity is shared ("between 3 children": children)'],
  ['calc.ask.state', 'state', 'topic', 'Which state of the quantity ("left", "at first")'],
  ['calc.ask.aggregate', 'aggregate', 'topic', 'The sum asked for ("in total")'],
  ['calc.ask.extreme', 'extreme', 'topic', 'The extreme asked for ("the most")'],
  ['calc.ask.compare', 'compare', 'topic', 'The comparison asked for ("more", "fewer")'],
];

export function arithmeticShard() {
  const facts = WORDS.map(([t, kind, form, calc, factor, markers, state, example]) => wire(`w.lang.en.calc.${kind}.${form ? `${form}.` : ''}${t.replace(/[^a-z]+/g, '_')}`, 'w.lang.en.calc',
    [['text', text(t)], ['kind', kind], ['form', form], ['calc', calc], ['factor', factor === null ? null : String(factor)], ...markers.map((m) => ['marker', m]), ['state', state], ['example', text(example)]], SRC));
  const lexes = Object.entries(LEXICONS).map(([name, { doc, items }]) => wire(`w.lang.en.lex.${name}`, 'w.lang.en.lex', [['name', name], ['doc', text(doc)], ...items.map((i) => ['item', text(i)])], SRC));
  const frames = FRAMES.flatMap(([name, priority, example, parts, why]) => [`# ${name}: ${why}`, ...frameLines(name, { act: 'ask', mode: 'calc', set: 'acts', priority, needs: 'calc', roles: rolesOf(parts), example }, parts)]);
  const maps = ROLE_MAPS.map(([n, r, actRole, doc]) => wire(`w.lang.en.role_map.${n}`, 'w.lang.en.role_map', [['name', n], ['act', 'ask'], ['role', r], ['act_role', actRole], ['doc', text(doc)]], SRC));
  return `${header({ id: 'w.lang.en/shards/arithmetic', about: `arithmetic words and frames (reviewer block 2026-11-15 09:20, PSys2 Q18 K4): ${WORDS.length} words of arithmetic with the core.calc function each names (operators, comparisons, aggregates, extremes, states of a quantity), ${Object.keys(LEXICONS).length} lexicons drawn from them, and ${FRAMES.length} frames of the act ask in the mode calc ("what is 3 plus 4", "how many apples does Tom have left", "who has the most apples", "how many more apples does Ana have than Tom"), needs=calc.`,
    sources: ['hand-core 1 (written in this repository, own: tools/lang-en-arithmetic.mjs; the function names are the core.calc builtins of sopworld)'], license: 'CC0-1.0', script: 'tools/lang-en-arithmetic.mjs' })}\n# Words of arithmetic.\n${facts.join('\n')}\n\n# Lexicons of the frames, from the words.\n${lexes.join('\n')}\n\n# Frames.\n${frames.join('\n')}\n\n# Role maps of these frames.\n${maps.join('\n')}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const t = arithmeticShard();
  writeFileSync(join(WORLDS_DIR, 'w.lang.en', 'shards', 'arithmetic.sop'), t);
  console.log(`arithmetic.sop: ${WORDS.length} words, ${FRAMES.length} frames, ${t.split('\n').filter((l) => l.startsWith('@')).length} wires, ${Buffer.byteLength(t)} bytes`);
}
