// w.lang.en: the class of every closed-class word (reviewer block "02:15", for the library's type signatures: a
// closed-class word stays literal, and its class is the coarse level a signature backs off to).
//   node tools/lang-en-closed.mjs [--check]
// Reads the closed word lists of w.lang.en (determiners, pronouns, prepositions, numerals, question words,
// auxiliaries, negation, the markers of requests, ellipsis, corrections and answers) and writes one fact per word and
// class, `w.lang.en.closed text= class= from=<type>...`, to shards/closed-classes.sop. The word lists stay the home of
// the words; this shard is derived from them (rerun by `npm run build`), and the classes are this file's tables:
//   - a list that is one class (TYPE_CLASS) gives its class to every word in it, multi-word ones included where the
//     whole is one word of that class ("in front of", "how many"), with exceptions by word (BY_TYPE);
//   - a list of markers (MARKER_TYPES: answers, corrections, leads, skipped words) gives a class to its single words
//     only, from WORDS; its phrases ("scratch that") are phrases, not words;
//   - open-class words found in those lists (want, think, lose, new, colour ...) get no class here (OPEN): they are
//     k.words' and k.actions' words.
// The classes are the closed classes of Universal Dependencies' parts of speech, named in English: determiner (DET),
// pronoun (PRON), preposition (ADP), conjunction (CCONJ, SCONJ), auxiliary (AUX), numeral (NUM), ordinal (ADJ with
// NumType=Ord), adverb (ADV: the function adverbs of these lists), particle (PART), interjection (INTJ).
// --check: exit 1 when the shard on disk differs or a word of a marker list has no class and is not open.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR, factsOf } from './lib/worlds.mjs';
import { byText, seg, wire, header } from './import/lib.mjs';

export const CLASSES = ['determiner', 'pronoun', 'preposition', 'conjunction', 'auxiliary', 'numeral', 'ordinal', 'adverb', 'particle', 'interjection'];
const SOURCE = 'hand-core 1';
const P = 'w.lang.en.';

// Lists that are one class. `null` for a word: not a closed-class word in that list.
export const TYPE_CLASS = {
  det: 'determiner', pron: 'pronoun', anaphor: 'pronoun', prep: 'preposition', 'prep.time': 'preposition', ordinal: 'ordinal',
  numeral: 'numeral', aux: 'auxiliary', copula: 'auxiliary', relpron: 'pronoun', partitive: 'determiner', other: 'determiner',
  choice: 'conjunction', 'coord.sep': 'conjunction', wh: 'pronoun', neg: 'particle', 'neg.imperative': 'auxiliary', word: null,
};
// Exceptions by list and word (a function of the fact for det and pron: the numeral determiners, the locative pronoun).
export const BY_TYPE = {
  det: (t, f) => (f.attrs.kind?.[0] === 'numeral' ? 'numeral' : f.attrs.kind?.[0] === 'modifier' ? null : 'determiner'),
  pron: (t, f) => ((f.attrs.case ?? []).includes('locative') ? 'adverb' : 'pronoun'),
  anaphor: (t) => (t.includes(' ') ? null : 'pronoun'), // "that one", "this animal": phrases
  partitive: (t) => (t === 'of' ? 'preposition' : 'determiner'),
  other: (t) => (/others$/.test(t) ? 'pronoun' : 'determiner'),
  wh: (t) => ({ what: 'pronoun', which: 'determiner', who: 'pronoun', whom: 'pronoun', whose: 'pronoun', where: 'adverb', when: 'adverb', why: 'adverb', how: 'adverb', 'how many': 'determiner', 'how much': 'determiner' })[t],
  neg: (t) => { const m = { not: 'particle', no: 'determiner', never: 'adverb', without: 'preposition', nothing: 'pronoun', none: 'pronoun', nobody: 'pronoun', nowhere: 'adverb', neither: 'conjunction', nor: 'conjunction', minus: 'preposition', lose: null }; return t in m ? m[t] : /^(cannot|[a-z]+nt)$/.test(t) ? 'auxiliary' : undefined; }, // dont, isnt: auxiliaries typed without the apostrophe
  'neg.imperative': (t) => (t.includes(' ') ? null : 'auxiliary'), // dont, don't; "do not ever" is a phrase
  'coord.sep': (t) => (/^[a-z&]+$/.test(t) ? 'conjunction' : null), // the comma is punctuation
  // w.lang.en.word: by its category; ATTRN are nouns (colour, size): open
  word: (t, f) => ({ BACKTO: 'preposition', DEIXIS: /^(here|there)$/.test(t) ? 'adverb' : 'pronoun', DEM: 'determiner', EVERYTHING: 'pronoun',
    EXCEPT: t === 'but' ? 'conjunction' : 'preposition', HAVE: 'auxiliary', HOWMANY: 'determiner', OF: 'preposition', ONE: 'pronoun', ONE1: 'pronoun',
    ONES: 'pronoun', POSS: 'particle', QALL: 'determiner', THE: 'determiner', THERE: 'pronoun', WHY: 'adverb', AUXNEG: 'auxiliary', IF: 'conjunction',
    THEN: 'adverb', ATTRN: null })[f.attrs.cat?.[0]],
};
// Lists of markers: only their single words, classed by WORDS (by list first, in MARKER_BY_TYPE).
export const MARKER_TYPES = ['answer', 'correction', 'correction.lead', 'frame_lead', 'ellipsis.lead', 'ellipsis.trail', 'ellipsis.repeat',
  'ellipsis.starter', 'imperative.lead', 'neg.imperative.skip', 'skip', 'joiner', 'joiner.keep'];
const list = (cls, words) => Object.fromEntries(words.split(' ').map((w) => [w, cls]));
export const WORDS = {
  ...list('interjection', 'yes yeah yep yup yea no nope nah idk sorry oops whoops ugh hmm hm um uh er oh ah well ok okay please pls plz thanks hey wait'),
  ...list('adverb', 'maybe perhaps probably sometimes kinda actually rather always now then also too instead again just very really kindly'),
  ...list('conjunction', 'and but if so or'),
  ...list('auxiliary', 'is are was were does do did can could will would should has have be being been'),
  ...list('pronoun', 'i you we us yourself myself ourselves yourselves urself who whom whose what which'),
  ...list('adverb', 'where when why how'),
  ...list('determiner', 'my a its'),
  ...list('preposition', 'of on to for with'),
  ...list('particle', 'not'),
};
export const MARKER_BY_TYPE = { 'correction.lead': { on: 'particle' }, 'neg.imperative.skip': { have: null } }; // hold on; "do not have to": the verb
// Open-class words in the marker lists: no class here.
export const OPEN = new Set('unsure sure know worry mind forget think care bother say like want need let lets wanna love wish hold bad mistake second sec'.split(' '));

const unq = (v) => String(v).replace(/^"|"$/g, '');
const isWord = (t) => /^[a-z']+$/.test(t);

/** The closed-class facts of w.lang.en: { lines, missing: [type, word] without a class, open: [type, word] }. */
export function closedClasses(facts = factsOf('w.lang.en', [...Object.keys(TYPE_CLASS), ...MARKER_TYPES].map((t) => P + t))) {
  const by = new Map(); // `${text}|${class}` -> { text, cls, from:Set }
  const missing = [], open = [];
  const add = (t, cls, type) => { const k = `${t}|${cls}`; if (!by.has(k)) by.set(k, { text: t, cls, from: new Set() }); by.get(k).from.add(P + type); };
  for (const f of facts) {
    const type = f.type.slice(P.length);
    for (const t of (f.attrs.text ?? []).map(unq).map((x) => x.toLowerCase())) {
      if (type in TYPE_CLASS) {
        const cls = BY_TYPE[type] ? BY_TYPE[type](t, f) : TYPE_CLASS[type];
        if (cls === null) { if (isWord(t)) open.push([type, t]); continue; }
        if (cls === undefined) { missing.push([type, t]); continue; }
        add(t, cls, type);
      } else {
        if (!isWord(t)) continue; // a phrase of a marker list
        const own = MARKER_BY_TYPE[type]?.[t];
        const cls = own !== undefined ? own : OPEN.has(t) ? null : WORDS[t];
        if (cls === null) { open.push([type, t]); continue; }
        if (cls === undefined) { missing.push([type, t]); continue; }
        add(t, cls, type);
      }
    }
  }
  const lines = [...by.values()].sort((a, b) => byText(a.text, b.text) || byText(a.cls, b.cls))
    .map((e) => wire(`w.lang.en.closed.${seg(e.text.replace(/'/g, 'q').replace(/&/g, 'amp'))}.${e.cls}`, 'w.lang.en.closed', [['text', e.text], ['class', e.cls], ...[...e.from].sort(byText).map((x) => ['from', x])], SOURCE));
  return { lines, missing, open: [...new Map(open.map((x) => [x.join('|'), x])).values()] };
}

export const SHARD = join(WORLDS_DIR, 'w.lang.en', 'shards', 'closed-classes.sop');
export function shardText({ lines } = closedClasses()) {
  return `${header({
    id: 'w.lang.en/shards/closed-classes',
    about: `the class of each of the ${new Set(lines.map((l) => /text=("[^"]*"|\S+)/.exec(l)[1])).size} closed-class words of this world's word lists (${lines.length} facts: a word of several classes has one fact per class; \`from\` names the lists it is in), derived from those lists by the tables of the script`,
    sources: ['hand-core 1 (the classes, written in this repository; the words are those of the lists named in `from`)'],
    license: 'CC0-1.0',
    script: 'tools/lang-en-closed.mjs',
  })}\n${lines.join('\n')}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = closedClasses();
  const text = shardText(r);
  if (process.argv.includes('--check')) {
    let old = '';
    try { old = readFileSync(SHARD, 'utf8'); } catch {}
    if (old !== text || r.missing.length) { console.error(`closed-classes: ${old !== text ? 'stale shard; ' : ''}${r.missing.length} words without a class: ${r.missing.map((x) => x.join(' ')).join(', ')}`); process.exit(1); }
  } else writeFileSync(SHARD, text);
  const counts = {};
  for (const l of r.lines) { const c = /class=(\S+)/.exec(l)[1]; counts[c] = (counts[c] ?? 0) + 1; }
  console.log(JSON.stringify({ facts: r.lines.length, words: new Set(r.lines.map((l) => /text=("[^"]*"|\S+)/.exec(l)[1])).size, classes: counts, missing: r.missing.length, open: r.open.length }));
  if (r.missing.length) console.log('missing:', r.missing.map((x) => x.join(' ')).join(', '));
  console.log('open:', r.open.map((x) => x.join(' ')).join(', '));
}
