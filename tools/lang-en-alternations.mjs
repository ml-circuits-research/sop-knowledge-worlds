// w.lang.en: alternations as facts (reviewer 21:55; the library's questions.md Q54 item 2, sopworld 0.75
// `normalise` / `alternationsOf`): passive, wh-fronting, question vs command, request wrappers ("could you", "I want
// you to", "please"), dative shift and ellipsis, each a rule over a whole sentence that brings a variant back to the
// canonical form a frame of w.lang.en is written in, so the frames need not list their variants.
// The fact is the library's format, `w.lang.en.alternation name= from= to= mode=`, with the family it belongs to (the
// up edge of a construction, for the library's cousins). `from` and `to` are in the library's pattern notation: words,
// and `{x}` for a span of one word or more (shortest first); `{x:base}` in `to` is the base form of a span's first
// word (not used here: the passive writes each base out). The library's `[a|b]` alternatives are not used (hard rule 3: no `a|b` inside a value): each alternative is
// a fact of its own, generated from the tables below, all of one family. The facts are applied in the order told, to
// a fixpoint: a more specific rule comes before a more general one.
// The test sentences are facts too (`w.lang.en.alternation_case`): a variant, its canonical form, the rules applied.
//   node tools/lang-en-alternations.mjs     writes docs/worlds/w.lang.en/shards/alternations.sop
import { join } from 'node:path';
import { WORLDS_DIR } from './lib/worlds.mjs';
import { wire, header, seg, text, writeShards } from './import/lib.mjs';

const SRC = 'hand-core 1';

// [name, about, parent]
export const FAMILIES = [
  ['alternation', 'one meaning said in another form of words; the form a frame is written in is the canonical one', undefined],
  ['request wrapper', 'words around a command that make it polite, ask whether it can be done or say that it is wanted; the command is the same', 'alternation'],
  ['polite word', 'please, kindly', 'request wrapper'],
  ['ability question', 'could you, can you, would you, will you', 'request wrapper'],
  ['desire', 'I want you to, I would like you to, I want to', 'request wrapper'],
  ['suggestion', "let's, let us, go ahead and", 'request wrapper'],
  ['sequence lead', 'now, then, next: the order of commands, not their meaning', 'request wrapper'],
  ['question form', 'a question asked in another order of words, or as a command to tell', 'alternation'],
  ['question vs command', 'a question put as a command or a statement: tell me where, do you know what, I wonder who', 'question form'],
  ['embedded question', 'the order of words of a question inside a sentence (where the cat is), back to the order of a question (where is the cat)', 'question form'],
  ['wh in situ', 'the question word left in the place of what is asked (a cow makes what sound), back to the front (what sound does a cow make)', 'question form'],
  ['voice', 'the doer and the thing done to change places', 'alternation'],
  ['passive', 'the thing done to first, the doer after by (the house was painted by the girl)', 'voice'],
  ['argument order', 'the roles of an act in another order', 'alternation'],
  ['dative shift', 'the one who gets a thing first, without to or for (give me the ball), back to after it (give the ball to me)', 'argument order'],
  ['context', 'a sentence that leaves out what the one before said', 'alternation'],
  ['ellipsis', 'and, also, too, the same for, what about: the rest of the act is the one before', 'context'],
];

const WH = ['what', 'where', 'who', 'which', 'how', 'when', 'whose'];
const PRON = ['me', 'us', 'them'];
// Participles of common verbs of the acts of k.actions and of k.actions actions (draw, paint, eat, chase...).
const PARTICIPLES = [['drawn', 'draw'], ['painted', 'paint'], ['made', 'make'], ['built', 'build'], ['written', 'write'], ['coloured', 'colour'], ['colored', 'color'],
  ['eaten', 'eat'], ['chased', 'chase'], ['caught', 'catch'], ['held', 'hold'], ['carried', 'carry'], ['moved', 'move'], ['opened', 'open'], ['closed', 'close'],
  ['sent', 'send'], ['given', 'give'], ['taken', 'take'], ['removed', 'remove'], ['added', 'add'], ['placed', 'place'], ['cut', 'cut'], ['thrown', 'throw'], ['seen', 'see']];
// Not tell or show: "tell me the capital of Japan", "show me what I can draw" ask (frames of their own), they give nothing.
const TO_VERBS = ['give', 'send', 'hand', 'pass', 'bring', 'read', 'lend', 'throw', 'offer'];
const FOR_VERBS = ['draw', 'make', 'build', 'paint', 'find', 'get', 'buy', 'bake', 'cook', 'write'];

// The rules, in the order they are tried: [name, family, from, to, mode].
export function rules() {
  const R = [];
  const r = (name, family, from, to, mode) => R.push({ name, family, from, to, mode });
  // Question vs command first ("can you tell me where..." loses "can you" by a wrapper, then "tell me").
  for (const [lead, id] of [['tell me', 'tell_me'], ['do you know', 'do_you_know'], ['i want to know', 'i_want_to_know'], ['i would like to know', 'i_would_like_to_know'], ['i wonder', 'i_wonder']]) {
    for (const w of WH) r(`${id}_${w}`, 'question vs command', `${lead} ${w} {x}`, `${w} {x}`, 'question');
    // A yes-no question put as a command: tell me if Bolivia is landlocked -> is bolivia landlocked.
    for (const c of ['is', 'are']) for (const iff of ['if', 'whether']) r(`${id}_${iff}_${c}`, 'question vs command', `${lead} ${iff} {x} ${c} {y}`, `${c} {x} {y}`, 'question');
  }
  // Request wrappers.
  r('please', 'polite word', 'please {x}', '{x}', 'request');
  r('please_after', 'polite word', '{x} please', '{x}', 'request');
  r('kindly', 'polite word', 'kindly {x}', '{x}', 'request');
  for (const m of ['could', 'can', 'would', 'will']) r(`${m}_you`, 'ability question', `${m} you {x}`, '{x}', 'request');
  for (const [lead, id] of [['i want you to', 'i_want_you_to'], ['i need you to', 'i_need_you_to'], ['i would like you to', 'i_would_like_you_to'], ["i'd like you to", 'id_like_you_to'],
    ['i want to', 'i_want_to'], ['i would like to', 'i_would_like_to'], ["i'd like to", 'id_like_to']]) r(id, 'desire', `${lead} {x}`, '{x}', 'request');
  for (const [lead, id] of [["let's", 'lets'], ['let us', 'let_us'], ['go ahead and', 'go_ahead_and']]) r(id, 'suggestion', `${lead} {x}`, '{x}', 'request');
  for (const lead of ['now', 'then', 'next']) r(lead, 'sequence lead', `${lead} {x}`, '{x}');
  // Ellipsis: the act is the one before; the mode says so.
  for (const [from, id] of [['and also {x}', 'and_also'], ['and {x}', 'and'], ['also {x}', 'also'], ['{x} too', 'too'], ['{x} as well', 'as_well'], ['the same for {x}', 'the_same_for'],
    ['same for {x}', 'same_for'], ['what about {x}', 'what_about'], ['how about {x}', 'how_about']]) r(id, 'ellipsis', from, '{x}', 'ellipsis');
  // There is / there are after an embedded question word: how many houses there are -> how many houses are there.
  for (const c of ['is', 'are']) r(`embedded_there_${c}`, 'embedded question', `how many {y} there ${c}`, `how many {y} ${c} there`, 'question');
  // Embedded question: the copula back before its subject; the rule with a determiner first (what colour the car is).
  for (const w of ['what', 'where', 'who', 'which', 'how', 'whose']) for (const c of ['is', 'are']) {
    for (const d of ['the', 'a']) r(`embedded_${w}_${d}_${c}`, 'embedded question', `${w} {y} ${d} {x} ${c}`, `${w} {y} ${c} ${d} {x}`, 'question');
    r(`embedded_${w}_${c}`, 'embedded question', `${w} {x} ${c}`, `${w} ${c} {x}`, 'question');
  }
  // Embedded question with a verb: do back before the subject (how many legs a spider has -> how many legs does a
  // spider have); a determiner marks where the subject starts, else the asked noun is one word (shortest first).
  // Only has: the canonical form ends in have, so a rule on have would apply to its own output.
  for (const [v, base, does] of [['has', 'have', 'does']]) {
    for (const d of ['the', 'a']) r(`embedded_how_many_${d}_${v}`, 'embedded question', `how many {y} ${d} {x} ${v}`, `how many {y} ${does} ${d} {x} ${base}`, 'question');
    r(`embedded_how_many_${v}`, 'embedded question', `how many {y} {x} ${v}`, `how many {y} ${does} {x} ${base}`, 'question');
  }
  // Wh in situ: the question word back to the front, with do where the verb is not the copula.
  for (const c of ['is', 'are']) {
    for (const w of ['what', 'which', 'how']) r(`in_situ_${c}_${w}_n`, 'wh in situ', `{x} ${c} ${w} {y}`, `${w} {y} ${c} {x}`, 'question');
    for (const w of ['what', 'where', 'who']) r(`in_situ_${c}_${w}`, 'wh in situ', `{x} ${c} ${w}`, `${w} ${c} {x}`, 'question');
  }
  for (const [v, base, does] of [['has', 'have', 'does'], ['have', 'have', 'do'], ['makes', 'make', 'does'], ['make', 'make', 'do'], ['eats', 'eat', 'does'], ['eat', 'eat', 'do'], ['says', 'say', 'does']]) {
    r(`in_situ_${v}_how_many`, 'wh in situ', `{x} ${v} how many {y}`, `how many {y} ${does} {x} ${base}`, 'question');
    for (const w of ['what', 'which']) r(`in_situ_${v}_${w}_n`, 'wh in situ', `{x} ${v} ${w} {y}`, `${w} {y} ${does} {x} ${base}`, 'question');
    r(`in_situ_${v}_what`, 'wh in situ', `{x} ${v} what`, `what ${does} {x} ${base}`, 'question');
  }
  for (const [v, base, does] of [['lives', 'live', 'does'], ['live', 'live', 'do']]) r(`in_situ_${v}_where`, 'wh in situ', `{x} ${v} where`, `where ${does} {x} ${base}`, 'question');
  // Passive: the doer back to the front. One rule per participle of the common acts (a span for the verb would read
  // "the cat is sitting by the door" as a passive), the base written out (no lemma needed).
  for (const [part, base] of PARTICIPLES) {
    for (const aux of ['is', 'was', 'are', 'were']) r(`passive_${aux}_${seg(part)}`, 'passive', `{y} ${aux} ${part} by {x}`, `{x} ${base} {y}`);
    for (const aux of ['has', 'have']) r(`passive_${aux}_been_${seg(part)}`, 'passive', `{y} ${aux} been ${part} by {x}`, `{x} ${base} {y}`);
  }
  // Dative shift: the frames of w.lang.en write the one who gets it after to or for (send table 2 to the diagram).
  for (const v of TO_VERBS) for (const p of PRON) r(`dative_${v}_${p}`, 'dative shift', `${v} ${p} {y}`, `${v} {y} to ${p}`);
  for (const v of FOR_VERBS) for (const p of PRON) r(`benefactive_${v}_${p}`, 'dative shift', `${v} ${p} {y}`, `${v} {y} for ${p}`);
  return R;
}

// Test sentences: [variant, canonical, rules applied in order, mode].
export const CASES = [
  ['please open the door', 'open the door', ['please'], 'request'],
  ['open the door please', 'open the door', ['please_after'], 'request'],
  ['could you open the door?', 'open the door', ['could_you'], 'request'],
  ['can you please draw a cat', 'draw a cat', ['can_you', 'please'], 'request'],
  ['I want you to make the sun yellow', 'make the sun yellow', ['i_want_you_to'], 'request'],
  ["I'd like you to remove the tree", 'remove the tree', ['id_like_you_to'], 'request'],
  ['I want to draw a house', 'draw a house', ['i_want_to'], 'request'],
  ["let's add a guest", 'add a guest', ['lets'], 'request'],
  ['now move the cat to the left', 'move the cat to the left', ['now'], undefined],
  ['tell me where the cat is', 'where is the cat', ['tell_me_where', 'embedded_where_is'], 'question'],
  ['can you tell me what colour the car is?', 'what colour is the car', ['can_you', 'tell_me_what', 'embedded_what_the_is'], 'question'],
  ['do you know how many legs a spider has', 'how many legs does a spider have', ['do_you_know_how', 'embedded_how_many_a_has'], 'question'],
  ['do you know how many neighbours Hungary has?', 'how many neighbours does hungary have', ['do_you_know_how', 'embedded_how_many_has'], 'question'],
  ['tell me how many houses there are', 'how many houses are there', ['tell_me_how', 'embedded_there_are'], 'question'],
  ['can you tell me if Bolivia is landlocked?', 'is bolivia landlocked', ['can_you', 'tell_me_if_is'], 'question'],
  ['I wonder who lives in the castle', 'who lives in the castle', ['i_wonder_who'], 'question'],
  ['the capital of France is what', 'what is the capital of france', ['in_situ_is_what'], 'question'],
  ['the car is what colour', 'what colour is the car', ['in_situ_is_what_n'], 'question'],
  ['a cow makes what sound', 'what sound does a cow make', ['in_situ_makes_what_n'], 'question'],
  ['a spider has how many legs', 'how many legs does a spider have', ['in_situ_has_how_many'], 'question'],
  ['penguins live where', 'where do penguins live', ['in_situ_live_where'], 'question'],
  ['the house was painted by the girl', 'the girl paint the house', ['passive_was_painted'], undefined],
  ['the picture has been sent by Ann', 'ann send the picture', ['passive_has_been_sent'], undefined],
  ['the cat is sitting by the door', 'the cat is sitting by the door', [], undefined],
  ['the mouse was chased by the cat', 'the cat chase the mouse', ['passive_was_chased'], undefined],
  ['give me the ball', 'give the ball to me', ['dative_give_me'], undefined],
  ['please send us the picture', 'send the picture to us', ['please', 'dative_send_us'], 'request'],
  ['draw me a sheep', 'draw a sheep for me', ['benefactive_draw_me'], undefined],
  ['read me a story', 'read a story to me', ['dative_read_me'], undefined],
  ['tell me the capital of Japan', 'tell me the capital of japan', [], undefined],
  ['and a dog too', 'a dog', ['and', 'too'], 'ellipsis'],
  ['what about the tree?', 'the tree', ['what_about'], 'ellipsis'],
  ['the same for the house', 'the house', ['the_same_for'], 'ellipsis'],
  ['open the door', 'open the door', [], undefined],
  ['what is the capital of France', 'what is the capital of france', [], undefined],
];

export function alternationShard() {
  const R = rules();
  const fam = FAMILIES.map(([name, about, parent]) => wire(`w.lang.en.alternation_family.${seg(name)}`, 'w.lang.en.alternation_family', [['name', name], ['about', text(about)], ['parent', parent]], SRC));
  const lines = R.map((x, i) => wire(`w.lang.en.alternation.${x.name}`, 'w.lang.en.alternation', [['name', x.name], ['n', i + 1], ['family', x.family], ['from', text(x.from)], ['to', text(x.to)], ['mode', x.mode]], SRC));
  const cases = CASES.map(([v, canon, applied, mode]) => wire(`w.lang.en.alternation_case.${seg(v.toLowerCase())}`, 'w.lang.en.alternation_case', [['text', text(v)], ['canonical', text(canon)], ...applied.map((a) => ['applied', a]), ['mode', mode]], SRC));
  return `${header({
    id: 'w.lang.en/shards/alternations',
    about: `${R.length} alternations in ${FAMILIES.length - 1} families (request wrappers, question vs command, embedded questions, wh in situ, passive, dative shift, ellipsis), each a rule from a variant to the canonical form a frame is written in, in the library's format (questions.md Q54 there: w.lang.en.alternation name= from= to= mode=), applied in the order told (n); and ${CASES.length} test sentences.`,
    sources: ['hand-core 1 (hand-written in this repository: tools/lang-en-alternations.mjs)'], license: 'CC0-1.0', script: 'tools/lang-en-alternations.mjs',
  })}\n# Families of alternations, with the family above (the up edges of a construction, for the library's cousins).\n${fam.join('\n')}\n\n# Alternations, in the order they are tried (n).\n${lines.join('\n')}\n\n# Test sentences: a variant, its canonical form, the rules applied in order, the mode.\n${cases.join('\n')}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const t = alternationShard();
  writeShards(join(WORLDS_DIR, 'w.lang.en', 'shards'), { 'alternations.sop': t }, 'alternations');
  console.log('alternations.sop', t.split('\n').filter((l) => l.startsWith('@')).length, 'wires', Buffer.byteLength(t), 'bytes');
}
