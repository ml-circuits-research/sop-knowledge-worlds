// w.lang.ro (block "09:25", first draft per blocks "09:45", "10:20" and "11:20"): Romanian as a language world in the
// library's std.morph notation (sopworld 0.52 classes and cells, 0.53 ordered and anchored alternations), read with
// `morphOf(world, { types: TYPES })`. Rules, not forms: paradigm classes with inheritance, the cells of each class
// (features -> suffix, with the stem's alternations), the irregular forms no class covers, spelling folds (Romanian
// written without diacritics), the clitic joiner, the closed classes, and a few realisation templates. The open
// lexicon is an external dictionary (one TSV row per lemma: lemma, class, gender, sense), split by the first folded
// letter of the lemma. Romanian words appear here only as data of this language world (reviewer 09:35); the keys,
// the comments and the structure are English. Every lemma, form and rule here is written by hand in this repository
// (source `hand-core 1`, CC0-1.0): no dictionary was imported.
//   node tools/lang-ro-core.mjs     writes docs/worlds/w.lang.ro/shards/*.sop and docs/worlds/w.lang.ro/dictionary/*.tsv
import { join } from 'node:path';
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { WORLDS_DIR } from './lib/worlds.mjs';
import { wire, header, seg, writeShards } from './import/lib.mjs';

const SRC = 'hand-core 1';
const W = 'w.lang.ro';
export const DIR = join(WORLDS_DIR, W);
// The library's morph types, renamed into this world (morphOf(world, { types: TYPES })).
export const TYPES = { cls: `${W}.class`, ending: `${W}.ending`, irregular: `${W}.irregular`, fold: `${W}.fold`, split: `${W}.split`, template: `${W}.template`, vowel: `${W}.vowel` };

// Spelling: the folded form of a word (what a user types without diacritics; the cedilla letters of old encodings).
export const FOLDS = [['ă', 'a'], ['â', 'a'], ['î', 'i'], ['ș', 's'], ['ț', 't'], ['ş', 's'], ['ţ', 't'], ['Ă', 'A'], ['Â', 'A'], ['Î', 'I'], ['Ș', 'S'], ['Ț', 'T'], ['Ş', 'S'], ['Ţ', 'T']];
export const foldText = (s) => FOLDS.reduce((t, [a, b]) => t.split(a).join(b), String(s));
export const VOWELS = 'aeiouăâî';
export const SPLITS = ['-'];

// ---- paradigm classes ----
// name, parent, drop, alternations (the class's list, used by cells marked alt=yes), part of speech, what it is.
// An alternation is from>to, at the stem's last vowel (@vowel), at its end (@end) or at the last place it occurs.
const T = ['t>ț@end', 'd>z@end', 's>ș@end']; // a consonant softened before the ending -i
export const CLASSES = [
  ['m.cons', null, null, T, 'noun', 'masculine, ends in a consonant, plural -i (copac, copaci, copacul, copacului, copacii, copacilor)'],
  ['m.e', null, 'e', T, 'noun', 'masculine in -e, plural -i (câine, câini, câinele)'],
  ['m.e.oa', 'm.e', null, ['oa>o', ...T], 'noun', 'as m.e, with oa > o in the plural (soare, sori)'],
  ['n.e', null, null, [], 'noun', 'neuter, ends in a consonant, plural -e (desen, desene, desenul, desenele)'],
  ['n.e.oa', 'n.e', null, ['o>oa'], 'noun', 'as n.e, with o > oa in the plural (picior, picioare; editor, editoare)'],
  ['n.e.ă', 'n.e', null, ['ă>e@vowel'], 'noun', 'as n.e, with ă > e in the plural (măr, mere; număr, numere)'],
  ['n.uri', null, null, [], 'noun', 'neuter, ends in a consonant, plural -uri (cerc, cercuri, cercul, cercurile)'],
  ['n.u', 'n.uri', 'u', [], 'noun', 'as n.uri, the lemma ends in -u (titlu, titluri, titlul)'],
  ['f.ă', null, 'ă', [], 'noun', 'feminine in -ă, plural -e (casă, case, casa, casei, casele)'],
  ['f.ă.e', 'f.ă', null, ['a>e@vowel'], 'noun', 'as f.ă, with a > e before -e (pară, pere; masă, mese)'],
  ['f.ăi', 'f.ă', null, [], 'noun', 'feminine in -ă, plural -i (mașină, mașini, mașinii)'],
  ['f.ăi.a', 'f.ăi', null, ['a>ă@vowel', 't>ț@end'], 'noun', 'as f.ăi, with a > ă and t > ț before -i (barcă, bărci; hartă, hărți)'],
  ['f.e', null, 'e', [], 'noun', 'feminine in -e, plural -i (pâine, pâini, pâinea, pâinii)'],
  ['f.e.alt', 'f.e', null, ['oa>o', 'a>ă@vowel', 't>ț@end'], 'noun', 'as f.e, with oa > o, a > ă and t > ț before -i (floare, flori; carte, cărți; noapte, nopți)'],
  ['f.ie', 'f.e', null, [], 'noun', 'feminine in -ie, plural -ii (linie, linii, linia, liniei)'],
  ['f.ea', null, 'a', [], 'noun', 'feminine in -ea, plural -le (stea, stele, steaua, stelei)'],
  ['a.1', null, null, [], 'adjective', 'four forms: m -, f -ă, m pl -i (softened), f pl -e (galben, galbenă, galbeni, galbene)'],
  ['a.1i', 'a.1', null, [], 'adjective', 'as a.1, feminine plural -i (mic, mică, mici, mici)'],
  ['a.1.oa', 'a.1', null, [], 'adjective', 'as a.1, with o > oa in the feminine (frumos, frumoasă, frumoși, frumoase)'],
  ['a.e', null, 'e', [], 'adjective', 'two forms: -e, plural -i (mare, mari; verde, verzi)'],
  ['a.u', null, 'u', [], 'adjective', 'm -u, f -ie, plural -ii (roșu, roșie, roșii)'],
  ['a.iu', null, 'u', [], 'adjective', 'm -iu, f -ie, plural -ii (portocaliu, portocalie, portocalii)'],
  ['a.ru', null, 'u', [], 'adjective', 'm -u after a consonant, f -ă, m pl -i, f pl -e (albastru, albastră, albaștri, albastre; negru, neagră)'],
  ['a.inv', null, null, [], 'adjective', 'one form for every gender and number (mov, roz, maro)'],
  ['v.a', null, 'a', [], 'verb', 'first conjugation, no suffix (muta: mut, muți, mută; mută!)'],
  ['v.a.ă3', 'v.a', null, ['ă>a'], 'verb', 'as v.a, with ă > a where the stem is stressed in the 3rd person (arăta: arăt, arată)'],
  ['v.a.ă', 'v.a', null, ['ă>a'], 'verb', 'as v.a, with ă > a where the stem is stressed (adăuga: adaug, adaugi, adaugă)'],
  ['v.a.u', 'v.a', null, [], 'verb', 'as v.a, with u > o and u > oa where the stem is stressed (juca: joc, joci, joacă)'],
  ['v.a.oa', 'v.a', null, ['o>oa'], 'verb', 'as v.a, with o > oa in the 3rd person (îngroșa: îngroș, îngroașă)'],
  ['v.a.ez', null, 'a', [], 'verb', 'first conjugation with -ez (desena: desenez, desenează; desenează!)'],
  ['v.a.iez', 'v.a.ez', null, [], 'verb', 'as v.a.ez after i (copia: copiez, copiază, copiem)'],
  ['v.ea', null, 'ea', [], 'verb', 'second conjugation in -ea (a stem stressed in the present)'],
  ['v.ea.u', 'v.ea', null, [], 'verb', 'as v.ea, with u > o and u > oa (putea: pot, poți, poate)'],
  ['v.ea.ă', 'v.ea', null, ['ă>a'], 'verb', 'as v.ea, with ă > a where the stem is stressed (plăcea: plac, place)'],
  ['v.e', null, 'e', [], 'verb', 'third conjugation in -e, participle -ut (face: fac, faci, face; făcut)'],
  ['v.e.s.d', 'v.e', null, [], 'verb', 'as v.e, participle d > s (deschide: deschis)'],
  ['v.e.s.g', 'v.e', null, [], 'verb', 'as v.e, participle g > s (șterge: șters)'],
  ['v.e.n', 'v.e', null, [], 'verb', 'as v.e, stem in -n, 2nd person singular n > i (obține: obțin, obții)'],
  ['v.e.s.n', 'v.e.n', null, [], 'verb', 'as v.e.n, participle n > s (pune: pui, pus)'],
  ['v.e.s.t', 'v.e', null, [], 'verb', 'as v.e, participle t > s (trimite: trimis; scoate: scos)'],
  ['v.e.s.c', 'v.e', null, [], 'verb', 'as v.e, participle c > s (întoarce: întors; duce: dus)'],
  ['v.e.iu', 'v.e', null, [], 'verb', 'as v.e, stem in -i, 1st person -u, participle -s (scrie: scriu, scrii, scris)'],
  ['v.i.esc', null, 'i', [], 'verb', 'fourth conjugation with -esc (vorbi: vorbesc, vorbește; vorbește!)'],
  ['v.i.iesc', 'v.i.esc', null, [], 'verb', 'as v.i.esc after a vowel (înlocui: înlocuiesc, înlocuiește)'],
];

// ---- cells ----
// A cell: [features, suffix, alternations?]; alternations `true` = the class's list, an array = the cell's own list.
const nounCells = (s) => [
  [{ num: 'sg', case: 'nomacc', def: 'no' }, s[0]], [{ num: 'sg', case: 'nomacc', def: 'yes' }, s[1]],
  [{ num: 'sg', case: 'gendat', def: 'no' }, s[2]], [{ num: 'sg', case: 'gendat', def: 'yes' }, s[3]],
  [{ num: 'pl', case: 'nomacc', def: 'no' }, s[4]], [{ num: 'pl', case: 'nomacc', def: 'yes' }, s[5]],
  [{ num: 'pl', case: 'gendat', def: 'no' }, s[6]], [{ num: 'pl', case: 'gendat', def: 'yes' }, s[7]],
];
const withAlt = (cells, alt, which = () => true) => cells.map(([f, s]) => [f, s, which(f) ? alt : undefined]);
const pl = (f) => f.num === 'pl';
const obl = (f) => f.num === 'pl' || f.case === 'gendat'; // the cells whose ending is the plural's (feminine nouns)
const pick = (cells, which) => cells.filter(([f]) => which(f));
// Adjectives: m, f, n by number and case; the neuter is the masculine in the singular and the feminine in the plural,
// the feminine singular genitive-dative the feminine plural. [m sg, f sg, m pl, f pl] with an alternation list each.
const adjCells = ([msg, fsg, mpl, fpl], alts = []) => {
  const out = [];
  for (const kase of ['nomacc', 'gendat']) {
    out.push([{ gender: 'm', num: 'sg', case: kase }, msg, alts[0]], [{ gender: 'n', num: 'sg', case: kase }, msg, alts[0]]);
    out.push(kase === 'nomacc' ? [{ gender: 'f', num: 'sg', case: kase }, fsg, alts[1]] : [{ gender: 'f', num: 'sg', case: kase }, fpl, alts[3]]);
    out.push([{ gender: 'm', num: 'pl', case: kase }, mpl, alts[2]], [{ gender: 'f', num: 'pl', case: kase }, fpl, alts[3]], [{ gender: 'n', num: 'pl', case: kase }, fpl, alts[3]]);
  }
  return out;
};
// Verbs: the infinitive (without "a"), the imperative (2nd person), the present and the conjunctive ("să ...") by
// person and number, and the past participle. [inf, imp sg, imp pl, pres 1sg..3pl, subj 1sg..3pl, part].
const P = [['1', 'sg'], ['2', 'sg'], ['3', 'sg'], ['1', 'pl'], ['2', 'pl'], ['3', 'pl']];
const verbCells = ([inf, ims, imp, pres, subj, part], alt = {}) => [
  [{ tense: 'inf' }, inf, alt.inf], [{ tense: 'imper', person: '2', num: 'sg' }, ims, alt.ims], [{ tense: 'imper', person: '2', num: 'pl' }, imp, alt.imp],
  ...P.map(([person, num], i) => [{ tense: 'pres', person, num }, pres[i], alt.pres?.[i]]),
  ...P.map(([person, num], i) => [{ tense: 'subj', person, num }, subj[i], alt.subj?.[i]]),
  [{ tense: 'part' }, part, alt.part],
];
const only = (cells, keep) => cells.filter(([f]) => keep(f)); // the cells a child class overrides
const is = (f, tense, person, num) => f.tense === tense && (!person || f.person === person) && (!num || f.num === num);
const soft = ['t>ț@end', 'd>z@end', 's>ș@end'];
const va = ['a', 'ă', 'ați', ['', 'i', 'ă', 'ăm', 'ați', 'ă'], ['', 'i', 'e', 'ăm', 'ați', 'e'], 'at'];
const ve = ['e', 'e', 'eți', ['', 'i', 'e', 'em', 'eți', ''], ['', 'i', 'ă', 'em', 'eți', 'ă'], 'ut'];
const veAlt = { pres: [undefined, ['d>z@end', 't>ț@end']], subj: [undefined, ['d>z@end', 't>ț@end'], ['e>ea'], undefined, undefined, ['e>ea']], part: ['a>ă@vowel'] };
// the 2nd person singular of an n-stem: the n becomes i, no ending (pun -> pui, obțin -> obții)
const veN = only(verbCells(ve), (f) => (f.tense === 'pres' || f.tense === 'subj') && f.person === '2' && f.num === 'sg').map(([f]) => [f, '', ['n>i@end']]);
// a d-stem keeps its e in the conjunctive (deschidă: the e of the root is not the last syllable's)
const veD = only(verbCells(ve), (f) => f.tense === 'subj' && f.person === '3').map(([f, sfx]) => [f, sfx]);
// oa > o where the ending is not stressed on it (scoate: scot, scoți, scot; întoarce: întorc), only in the classes of
// such verbs (an unanchored alternation is undone wherever an o is: questions.md Q52)
const veOa = only(verbCells(ve, { pres: [['oa>o'], ['oa>o', 'd>z@end', 't>ț@end'], , , , ['oa>o']], subj: [['oa>o'], ['oa>o', 'd>z@end', 't>ț@end']] }),
  (f) => (f.tense === 'pres' && (f.num === 'sg' ? f.person !== '3' : f.person === '3')) || (f.tense === 'subj' && f.num === 'sg' && f.person !== '3'));
const vePart = (c, oa = false) => only(verbCells(ve, { part: [...(oa ? ['oa>o'] : []), `${c}>s@end`] }), (f) => f.tense === 'part').map(([f, , a]) => [f, '', a]);
const third = (f) => (f.tense === 'pres' || f.tense === 'subj') && f.person === '3';
const stressed = (f) => is(f, 'imper', '2', 'sg') || ((f.tense === 'pres' || f.tense === 'subj') && (f.person === '3' || f.num === 'sg'));
export const CELLS = {
  'm.cons': withAlt(nounCells(['', 'ul', '', 'ului', 'i', 'ii', 'i', 'ilor']), true, pl),
  'm.e': withAlt(nounCells(['e', 'ele', 'e', 'elui', 'i', 'ii', 'i', 'ilor']), true, pl),
  'n.e': nounCells(['', 'ul', '', 'ului', 'e', 'ele', 'e', 'elor']),
  'n.e.oa': pick(withAlt(nounCells(['', 'ul', '', 'ului', 'e', 'ele', 'e', 'elor']), true, pl), pl),
  'n.e.ă': pick(withAlt(nounCells(['', 'ul', '', 'ului', 'e', 'ele', 'e', 'elor']), true, pl), pl),
  'n.uri': nounCells(['', 'ul', '', 'ului', 'uri', 'urile', 'uri', 'urilor']),
  'n.u': pick(nounCells(['u', 'ul', 'u', 'ului', 'uri', 'urile', 'uri', 'urilor']), (f) => f.def === 'no' && f.num === 'sg'),
  'f.ă': nounCells(['ă', 'a', 'e', 'ei', 'e', 'ele', 'e', 'elor']),
  'f.ă.e': pick(withAlt(nounCells(['ă', 'a', 'e', 'ei', 'e', 'ele', 'e', 'elor']), true, obl), obl),
  'f.ăi': pick(nounCells(['ă', 'a', 'i', 'ii', 'i', 'ile', 'i', 'ilor']), obl),
  'f.ăi.a': pick(withAlt(nounCells(['ă', 'a', 'i', 'ii', 'i', 'ile', 'i', 'ilor']), true, obl), obl),
  'f.e': nounCells(['e', 'ea', 'i', 'ii', 'i', 'ile', 'i', 'ilor']),
  'f.e.alt': pick(withAlt(nounCells(['e', 'ea', 'i', 'ii', 'i', 'ile', 'i', 'ilor']), true, obl), obl),
  'f.ie': pick(nounCells(['e', 'a', 'i', 'ei', 'i', 'ile', 'i', 'ilor']), (f) => f.num === 'sg' && f.def === 'yes'),
  'f.ea': nounCells(['a', 'aua', 'le', 'lei', 'le', 'lele', 'le', 'lelor']),
  'a.1': adjCells(['', 'ă', 'i', 'e'], [undefined, undefined, soft]),
  'a.1i': pick(adjCells(['', 'ă', 'i', 'i'], [undefined, undefined, soft]), (f) => (f.num === 'pl' && f.gender !== 'm') || (f.gender === 'f' && f.case === 'gendat')),
  'a.1.oa': pick(adjCells(['', 'ă', 'i', 'e'], [undefined, ['o>oa'], soft, ['o>oa']]), (f) => f.gender === 'f' || (f.gender === 'n' && f.num === 'pl')),
  'a.e': adjCells(['e', 'e', 'i', 'i'], [undefined, undefined, ['d>z@end', 't>ț@end'], ['d>z@end', 't>ț@end']]),
  'a.u': adjCells(['u', 'ie', 'ii', 'ii']),
  'a.iu': adjCells(['u', 'e', 'i', 'i']),
  'a.ru': adjCells(['u', 'ă', 'i', 'e'], [undefined, ['e>ea'], ['st>șt'], undefined]),
  'a.inv': adjCells(['', '', '', '']),
  'v.a': verbCells(va, { pres: [undefined, soft], subj: [undefined, soft] }),
  'v.a.ă3': only(verbCells(va, { ims: true, pres: [, , true, , , true], subj: [, , true, , , true] }), (f) => is(f, 'imper', '2', 'sg') || third(f)),
  'v.a.ă': only(verbCells(va, { ims: true, pres: [true, ['ă>a', ...soft], true, , , true], subj: [true, ['ă>a', ...soft], true, , , true] }), stressed),
  'v.a.u': only(verbCells(va, { ims: ['u>oa'], pres: [['u>o'], ['u>o', ...soft], ['u>oa'], , , ['u>oa']], subj: [['u>o'], ['u>o', ...soft], ['u>oa'], , , ['u>oa']] }), stressed),
  'v.a.oa': only(verbCells(va, { ims: true, pres: [, , true, , , true], subj: [, , true, , , true] }), (f) => is(f, 'imper', '2', 'sg') || third(f)),
  'v.a.ez': verbCells(['a', 'ează', 'ați', ['ez', 'ezi', 'ează', 'ăm', 'ați', 'ează'], ['ez', 'ezi', 'eze', 'ăm', 'ați', 'eze'], 'at']),
  'v.a.iez': only(verbCells(['a', 'ază', 'ați', ['ez', 'ezi', 'ază', 'em', 'ați', 'ază'], ['ez', 'ezi', 'eze', 'em', 'ați', 'eze'], 'at']), (f) => is(f, 'imper', '2', 'sg') || (f.tense === 'pres' && (f.person === '3' || (f.person === '1' && f.num === 'pl'))) || is(f, 'subj', '1', 'pl')),
  'v.ea': verbCells(['ea', 'e', 'eți', ['', 'i', 'e', 'em', 'eți', ''], ['', 'i', 'ă', 'em', 'eți', 'ă'], 'ut'], { pres: [undefined, soft], subj: [undefined, soft] }),
  'v.ea.u': only(verbCells(['ea', 'e', 'eți', ['', 'i', 'e', 'em', 'eți', ''], ['', 'i', 'ă', 'em', 'eți', 'ă'], 'ut'], { ims: ['u>oa'], pres: [['u>o'], ['u>o', ...soft], ['u>oa'], , , ['u>o']], subj: [['u>o'], ['u>o', ...soft], ['u>oa'], , , ['u>oa']] }), stressed),
  'v.ea.ă': only(verbCells(['ea', 'e', 'eți', ['', 'i', 'e', 'em', 'eți', ''], ['', 'i', 'ă', 'em', 'eți', 'ă'], 'ut'], { ims: true, pres: [true, ['ă>a', ...soft], true, , , true], subj: [true, ['ă>a', ...soft], true, , , true] }), stressed),
  'v.e': verbCells(ve, veAlt),
  'v.e.n': veN,
  'v.e.s.d': [...vePart('d'), ...veD], 'v.e.s.g': vePart('g'), 'v.e.s.n': vePart('n'), 'v.e.s.t': [...vePart('t', true), ...veOa], 'v.e.s.c': [...vePart('c', true), ...veOa],
  'v.e.iu': only(verbCells(['e', 'e', 'eți', ['u', 'i', 'e', 'em', 'eți', 'u'], ['u', 'i', 'e', 'em', 'eți', 'e'], 's']), (f) => (f.person === '1' && f.num === 'sg' && f.tense !== 'imper') || ((f.tense === 'pres' || f.tense === 'subj') && f.person === '3') || f.tense === 'part'),
  'v.i.esc': verbCells(['i', 'ește', 'iți', ['esc', 'ești', 'ește', 'im', 'iți', 'esc'], ['esc', 'ești', 'ească', 'im', 'iți', 'ească'], 'it']),
  'v.i.iesc': only(verbCells(['i', 'iește', 'iți', ['iesc', 'iești', 'iește', 'im', 'iți', 'iesc'], ['iesc', 'iești', 'iască', 'im', 'iți', 'iască'], 'it']), (f) => is(f, 'imper', '2', 'sg') || ((f.tense === 'pres' || f.tense === 'subj') && (f.num === 'sg' || f.person === '3'))),
};

// ---- irregular forms: only where no class covers the cell ----
// lemma -> [[features, form], ...]; a verb's whole present where its stems are suppletive.
const vIrr = (lemma, inf, ims, imp, pres, subj, part) => [lemma, verbCells([inf, ims, imp, pres, subj, part]).filter(([, s]) => s !== null).map(([f, s]) => [f, s])];
export const IRREGULAR = [
  vIrr('fi', 'fi', 'fii', 'fiți', ['sunt', 'ești', 'este', 'suntem', 'sunteți', 'sunt'], ['fiu', 'fii', 'fie', 'fim', 'fiți', 'fie'], 'fost'),
  ['fi', [[{ tense: 'pres', person: '3', num: 'sg' }, 'e']]], // a second form of a cell: analysed, never generated (the first is)
  // the auxiliaries of avea: the conditional (aș vrea) and the compound perfect (am desenat, s-a așezat)
  ['avea', P.map(([person, num], i) => [{ tense: 'cond', person, num }, ['aș', 'ai', 'ar', 'am', 'ați', 'ar'][i]])],
  ['avea', P.map(([person, num], i) => [{ tense: 'perf', person, num }, ['am', 'ai', 'a', 'am', 'ați', 'au'][i]])],
  vIrr('avea', 'avea', 'ai', 'aveți', ['am', 'ai', 'are', 'avem', 'aveți', 'au'], ['am', 'ai', 'aibă', 'avem', 'aveți', 'aibă'], 'avut'),
  vIrr('vrea', 'vrea', null, null, ['vreau', 'vrei', 'vrea', 'vrem', 'vreți', 'vor'], ['vreau', 'vrei', 'vrea', 'vrem', 'vreți', 'vrea'], 'vrut'),
  vIrr('da', 'da', 'dă', 'dați', ['dau', 'dai', 'dă', 'dăm', 'dați', 'dau'], ['dau', 'dai', 'dea', 'dăm', 'dați', 'dea'], 'dat'),
  vIrr('lua', 'lua', 'ia', 'luați', ['iau', 'iei', 'ia', 'luăm', 'luați', 'iau'], ['iau', 'iei', 'ia', 'luăm', 'luați', 'ia'], 'luat'),
  vIrr('veni', 'veni', 'vino', 'veniți', ['vin', 'vii', 'vine', 'venim', 'veniți', 'vin'], ['vin', 'vii', 'vină', 'venim', 'veniți', 'vină'], 'venit'),
  vIrr('vedea', 'vedea', 'vezi', 'vedeți', ['văd', 'vezi', 'vede', 'vedem', 'vedeți', 'văd'], ['văd', 'vezi', 'vadă', 'vedem', 'vedeți', 'vadă'], 'văzut'),
  vIrr('împărți', 'împărți', 'împarte', 'împărțiți', ['împart', 'împarți', 'împarte', 'împărțim', 'împărțiți', 'împart'], ['împart', 'împarți', 'împartă', 'împărțim', 'împărțiți', 'împartă'], 'împărțit'),
  // imperatives that are not the 3rd person singular
  ['face', [[{ tense: 'imper', person: '2', num: 'sg' }, 'fă']]],
  ['duce', [[{ tense: 'imper', person: '2', num: 'sg' }, 'du']]],
  ['merge', [[{ tense: 'imper', person: '2', num: 'sg' }, 'mergi']]],
  ['trece', [[{ tense: 'imper', person: '2', num: 'sg' }, 'treci']]],
  ['spăla', [[{ tense: 'pres', person: '2', num: 'sg' }, 'speli'], [{ tense: 'subj', person: '2', num: 'sg' }, 'speli']]],
  ['reface', [[{ tense: 'imper', person: '2', num: 'sg' }, 'refă']]],
  ['număra', [[{ tense: 'pres', person: '2', num: 'sg' }, 'numeri'], [{ tense: 'subj', person: '2', num: 'sg' }, 'numeri']]],
  ['umple', [[{ tense: 'part' }, 'umplut']]],
  // nouns: plurals with a stem no class gives (pești, cai, copii, băieți, femei, păsări, ferestre, zăpezi)
  ['pește', pick(nounCells(['pește', 'peștele', 'pește', 'peștelui', 'pești', 'peștii', 'pești', 'peștilor']), pl)],
  ['cal', pick(nounCells(['cal', 'calul', 'cal', 'calului', 'cai', 'caii', 'cai', 'cailor']), pl)],
  ['copil', pick(nounCells(['copil', 'copilul', 'copil', 'copilului', 'copii', 'copiii', 'copii', 'copiilor']), pl)],
  ['băiat', pick(nounCells(['băiat', 'băiatul', 'băiat', 'băiatului', 'băieți', 'băieții', 'băieți', 'băieților']), pl)],
  ['femeie', pick(nounCells(['femeie', 'femeia', 'femei', 'femeii', 'femei', 'femeile', 'femei', 'femeilor']), obl)],
  ['pasăre', pick(nounCells(['pasăre', 'pasărea', 'păsări', 'păsării', 'păsări', 'păsările', 'păsări', 'păsărilor']), obl)],
  ['fereastră', pick(nounCells(['fereastră', 'fereastra', 'ferestre', 'ferestrei', 'ferestre', 'ferestrele', 'ferestre', 'ferestrelor']), obl)],
  ['zăpadă', pick(nounCells(['zăpadă', 'zăpada', 'zăpezi', 'zăpezii', 'zăpezi', 'zăpezile', 'zăpezi', 'zăpezilor']), obl)],
  ['zi', nounCells(['zi', 'ziua', 'zile', 'zilei', 'zile', 'zilele', 'zile', 'zilelor'])],
  ['ou', pick(nounCells(['ou', 'oul', 'ou', 'oului', 'ouă', 'ouăle', 'ouă', 'ouălor']), pl)],
  ['om', pick(nounCells(['om', 'omul', 'om', 'omului', 'oameni', 'oamenii', 'oameni', 'oamenilor']), pl)],
  // adjectives
  ['nou', pick(adjCells(['nou', 'nouă', 'noi', 'noi']), (f) => f.gender === 'f' || f.num === 'pl')],
];

// ---- closed classes ----
const G = (s) => s.split(' ');
// form, lemma, kind, features (gender may be several: "m n")
export const DETERMINERS = [
  ['un', 'un', 'article', { def: 'no', gender: 'm n', num: 'sg', case: 'nomacc' }], ['o', 'un', 'article', { def: 'no', gender: 'f', num: 'sg', case: 'nomacc' }],
  ['unui', 'un', 'article', { def: 'no', gender: 'm n', num: 'sg', case: 'gendat' }], ['unei', 'un', 'article', { def: 'no', gender: 'f', num: 'sg', case: 'gendat' }],
  ['niște', 'un', 'article', { def: 'no', gender: 'm f n', num: 'pl', case: 'nomacc' }], ['unor', 'un', 'article', { def: 'no', gender: 'm f n', num: 'pl', case: 'gendat' }],
  ['cel', 'cel', 'adjectival', { gender: 'm n', num: 'sg', case: 'nomacc' }], ['cea', 'cel', 'adjectival', { gender: 'f', num: 'sg', case: 'nomacc' }],
  ['cei', 'cel', 'adjectival', { gender: 'm', num: 'pl', case: 'nomacc' }], ['cele', 'cel', 'adjectival', { gender: 'f n', num: 'pl', case: 'nomacc' }],
  ['celui', 'cel', 'adjectival', { gender: 'm n', num: 'sg', case: 'gendat' }], ['celei', 'cel', 'adjectival', { gender: 'f', num: 'sg', case: 'gendat' }], ['celor', 'cel', 'adjectival', { gender: 'm f n', num: 'pl', case: 'gendat' }],
  ['acest', 'acest', 'demonstrative', { distance: 'near', gender: 'm n', num: 'sg', case: 'nomacc' }], ['această', 'acest', 'demonstrative', { distance: 'near', gender: 'f', num: 'sg', case: 'nomacc' }],
  ['acești', 'acest', 'demonstrative', { distance: 'near', gender: 'm', num: 'pl', case: 'nomacc' }], ['aceste', 'acest', 'demonstrative', { distance: 'near', gender: 'f n', num: 'pl', case: 'nomacc' }],
  ['acestui', 'acest', 'demonstrative', { distance: 'near', gender: 'm n', num: 'sg', case: 'gendat' }], ['acestei', 'acest', 'demonstrative', { distance: 'near', gender: 'f', num: 'sg', case: 'gendat' }], ['acestor', 'acest', 'demonstrative', { distance: 'near', gender: 'm f n', num: 'pl', case: 'gendat' }],
  ['acel', 'acel', 'demonstrative', { distance: 'far', gender: 'm n', num: 'sg', case: 'nomacc' }], ['acea', 'acel', 'demonstrative', { distance: 'far', gender: 'f', num: 'sg', case: 'nomacc' }],
  ['acei', 'acel', 'demonstrative', { distance: 'far', gender: 'm', num: 'pl', case: 'nomacc' }], ['acele', 'acel', 'demonstrative', { distance: 'far', gender: 'f n', num: 'pl', case: 'nomacc' }],
  ['acelui', 'acel', 'demonstrative', { distance: 'far', gender: 'm n', num: 'sg', case: 'gendat' }], ['acelei', 'acel', 'demonstrative', { distance: 'far', gender: 'f', num: 'sg', case: 'gendat' }], ['acelor', 'acel', 'demonstrative', { distance: 'far', gender: 'm f n', num: 'pl', case: 'gendat' }],
  ['meu', 'meu', 'possessive', { person: '1', owner: 'sg', gender: 'm n', num: 'sg' }], ['mea', 'meu', 'possessive', { person: '1', owner: 'sg', gender: 'f', num: 'sg' }],
  ['mei', 'meu', 'possessive', { person: '1', owner: 'sg', gender: 'm', num: 'pl' }], ['mele', 'meu', 'possessive', { person: '1', owner: 'sg', gender: 'f n', num: 'pl' }],
  ['tău', 'tău', 'possessive', { person: '2', owner: 'sg', gender: 'm n', num: 'sg' }], ['ta', 'tău', 'possessive', { person: '2', owner: 'sg', gender: 'f', num: 'sg' }],
  ['tăi', 'tău', 'possessive', { person: '2', owner: 'sg', gender: 'm', num: 'pl' }], ['tale', 'tău', 'possessive', { person: '2', owner: 'sg', gender: 'f n', num: 'pl' }],
  ['său', 'său', 'possessive', { person: '3', owner: 'sg', gender: 'm n', num: 'sg' }], ['sa', 'său', 'possessive', { person: '3', owner: 'sg', gender: 'f', num: 'sg' }],
  ['nostru', 'nostru', 'possessive', { person: '1', owner: 'pl', gender: 'm n', num: 'sg' }], ['noastră', 'nostru', 'possessive', { person: '1', owner: 'pl', gender: 'f', num: 'sg' }],
  ['al', 'al', 'possessive_article', { gender: 'm n', num: 'sg' }], ['a', 'al', 'possessive_article', { gender: 'f', num: 'sg' }],
  ['ai', 'al', 'possessive_article', { gender: 'm', num: 'pl' }], ['ale', 'al', 'possessive_article', { gender: 'f n', num: 'pl' }],
  ['tot', 'tot', 'quantifier', { gender: 'm n', num: 'sg', case: 'nomacc' }], ['toată', 'tot', 'quantifier', { gender: 'f', num: 'sg', case: 'nomacc' }],
  ['toți', 'tot', 'quantifier', { gender: 'm', num: 'pl', case: 'nomacc' }], ['toate', 'tot', 'quantifier', { gender: 'f n', num: 'pl', case: 'nomacc' }], ['tuturor', 'tot', 'quantifier', { gender: 'm f n', num: 'pl', case: 'gendat' }],
  ['fiecare', 'fiecare', 'quantifier', { gender: 'm f n', num: 'sg' }],
  ['alt', 'alt', 'other', { gender: 'm n', num: 'sg' }], ['altă', 'alt', 'other', { gender: 'f', num: 'sg' }], ['alți', 'alt', 'other', { gender: 'm', num: 'pl' }], ['alte', 'alt', 'other', { gender: 'f n', num: 'pl' }],
  ['celălalt', 'celălalt', 'other', { def: 'yes', gender: 'm n', num: 'sg' }], ['cealaltă', 'celălalt', 'other', { def: 'yes', gender: 'f', num: 'sg' }],
  ['ceilalți', 'celălalt', 'other', { def: 'yes', gender: 'm', num: 'pl' }], ['celelalte', 'celălalt', 'other', { def: 'yes', gender: 'f n', num: 'pl' }],
  ['niciun', 'niciun', 'quantifier', { gender: 'm n', num: 'sg', polarity: 'neg' }], ['nicio', 'niciun', 'quantifier', { gender: 'f', num: 'sg', polarity: 'neg' }],
  ['câțiva', 'câțiva', 'quantifier', { gender: 'm', num: 'pl' }], ['câteva', 'câțiva', 'quantifier', { gender: 'f n', num: 'pl' }],
  ['primul', 'prim', 'ordinal', { value: 1, def: 'yes', gender: 'm n', num: 'sg' }], ['prima', 'prim', 'ordinal', { value: 1, def: 'yes', gender: 'f', num: 'sg' }],
  ['primii', 'prim', 'ordinal', { value: 1, def: 'yes', gender: 'm', num: 'pl' }], ['primele', 'prim', 'ordinal', { value: 1, def: 'yes', gender: 'f n', num: 'pl' }],
  ['ultimul', 'ultim', 'ordinal', { value: -1, def: 'yes', gender: 'm n', num: 'sg' }], ['ultima', 'ultim', 'ordinal', { value: -1, def: 'yes', gender: 'f', num: 'sg' }],
  ['ultimii', 'ultim', 'ordinal', { value: -1, def: 'yes', gender: 'm', num: 'pl' }], ['ultimele', 'ultim', 'ordinal', { value: -1, def: 'yes', gender: 'f n', num: 'pl' }],
];
// form, lemma, kind, case (several), person, num, gender, clitic (free | bound: before the verb | joined: after a hyphen), refers
export const PRONOUNS = [
  ['eu', 'eu', 'personal', 'nom', '1', 'sg', null, 'free', 'user'], ['mine', 'eu', 'personal', 'acc', '1', 'sg', null, 'free', 'user'], ['mie', 'eu', 'personal', 'gendat', '1', 'sg', null, 'free', 'user'],
  ['mă', 'eu', 'personal', 'acc', '1', 'sg', null, 'bound', 'user'], ['m', 'eu', 'personal', 'acc', '1', 'sg', null, 'joined', 'user'], ['îmi', 'eu', 'personal', 'gendat', '1', 'sg', null, 'bound', 'user'], ['mi', 'eu', 'personal', 'gendat', '1', 'sg', null, 'joined', 'user'],
  ['tu', 'tu', 'personal', 'nom', '2', 'sg', null, 'free', 'assistant'], ['tine', 'tu', 'personal', 'acc', '2', 'sg', null, 'free', 'assistant'], ['ție', 'tu', 'personal', 'gendat', '2', 'sg', null, 'free', 'assistant'],
  ['te', 'tu', 'personal', 'acc', '2', 'sg', null, 'bound', 'assistant'], ['îți', 'tu', 'personal', 'gendat', '2', 'sg', null, 'bound', 'assistant'], ['ți', 'tu', 'personal', 'gendat', '2', 'sg', null, 'joined', 'assistant'],
  ['el', 'el', 'personal', 'nom acc', '3', 'sg', 'm', 'free', 'thing'], ['ea', 'el', 'personal', 'nom acc', '3', 'sg', 'f', 'free', 'thing'],
  ['lui', 'el', 'personal', 'gendat', '3', 'sg', 'm', 'free', 'thing'], ['îl', 'el', 'personal', 'acc', '3', 'sg', 'm', 'bound', 'thing'], ['l', 'el', 'personal', 'acc', '3', 'sg', 'm', 'joined', 'thing'],
  ['o', 'el', 'personal', 'acc', '3', 'sg', 'f', 'bound', 'thing'], ['îi', 'el', 'personal', 'gendat', '3', 'sg', null, 'bound', 'thing'], ['i', 'el', 'personal', 'gendat', '3', 'sg', null, 'joined', 'thing'],
  ['noi', 'noi', 'personal', 'nom acc', '1', 'pl', null, 'free', 'user'], ['nouă', 'noi', 'personal', 'gendat', '1', 'pl', null, 'free', 'user'], ['ne', 'noi', 'personal', 'acc gendat', '1', 'pl', null, 'bound', 'user'],
  ['voi', 'voi', 'personal', 'nom acc', '2', 'pl', null, 'free', 'assistant'], ['vouă', 'voi', 'personal', 'gendat', '2', 'pl', null, 'free', 'assistant'], ['vă', 'voi', 'personal', 'acc gendat', '2', 'pl', null, 'bound', 'assistant'],
  ['ei', 'el', 'personal', 'nom acc gendat', '3', 'pl', 'm', 'free', 'thing'], ['ele', 'el', 'personal', 'nom acc', '3', 'pl', 'f', 'free', 'thing'], ['lor', 'el', 'personal', 'gendat', '3', 'pl', null, 'free', 'thing'],
  ['le', 'el', 'personal', 'acc gendat', '3', 'pl', null, 'bound', 'thing'],
  ['se', 'se', 'reflexive', 'acc', '3', null, null, 'bound', 'thing'], ['s', 'se', 'reflexive', 'acc', '3', null, null, 'joined', 'thing'], ['își', 'se', 'reflexive', 'gendat', '3', null, null, 'bound', 'thing'],
  ['acesta', 'acesta', 'demonstrative', 'nom acc', '3', 'sg', 'm', 'free', 'thing'], ['aceasta', 'acesta', 'demonstrative', 'nom acc', '3', 'sg', 'f', 'free', 'thing'],
  ['aceștia', 'acesta', 'demonstrative', 'nom acc', '3', 'pl', 'm', 'free', 'thing'], ['acestea', 'acesta', 'demonstrative', 'nom acc', '3', 'pl', 'f', 'free', 'thing'],
  ['ăsta', 'acesta', 'demonstrative', 'nom acc', '3', 'sg', 'm', 'free', 'thing'], ['asta', 'acesta', 'demonstrative', 'nom acc', '3', 'sg', 'f', 'free', 'thing'],
  ['ăștia', 'acesta', 'demonstrative', 'nom acc', '3', 'pl', 'm', 'free', 'thing'], ['astea', 'acesta', 'demonstrative', 'nom acc', '3', 'pl', 'f', 'free', 'thing'],
  ['acela', 'acela', 'demonstrative', 'nom acc', '3', 'sg', 'm', 'free', 'thing'], ['aceea', 'acela', 'demonstrative', 'nom acc', '3', 'sg', 'f', 'free', 'thing'],
  ['aceia', 'acela', 'demonstrative', 'nom acc', '3', 'pl', 'm', 'free', 'thing'], ['acelea', 'acela', 'demonstrative', 'nom acc', '3', 'pl', 'f', 'free', 'thing'],
  ['ăla', 'acela', 'demonstrative', 'nom acc', '3', 'sg', 'm', 'free', 'thing'], ['aia', 'acela', 'demonstrative', 'nom acc', '3', 'sg', 'f', 'free', 'thing'],
  ['ce', 'ce', 'interrogative', 'nom acc', null, null, null, 'free', 'thing'], ['cine', 'cine', 'interrogative', 'nom acc', null, null, null, 'free', 'any'], ['cui', 'cine', 'interrogative', 'gendat', null, null, null, 'free', 'any'],
  ['care', 'care', 'interrogative', 'nom acc', null, null, null, 'free', 'thing'],
  ['cât', 'cât', 'interrogative', 'nom acc', null, 'sg', 'm', 'free', 'thing'], ['câtă', 'cât', 'interrogative', 'nom acc', null, 'sg', 'f', 'free', 'thing'],
  ['câți', 'cât', 'interrogative', 'nom acc', null, 'pl', 'm', 'free', 'thing'], ['câte', 'cât', 'interrogative', 'nom acc', null, 'pl', 'f', 'free', 'thing'],
  ['unul', 'unul', 'indefinite', 'nom acc', '3', 'sg', 'm', 'free', 'thing'], ['una', 'unul', 'indefinite', 'nom acc', '3', 'sg', 'f', 'free', 'thing'],
  ['unii', 'unul', 'indefinite', 'nom acc', '3', 'pl', 'm', 'free', 'thing'], ['unele', 'unul', 'indefinite', 'nom acc', '3', 'pl', 'f', 'free', 'thing'],
  ['ceva', 'ceva', 'indefinite', 'nom acc', '3', 'sg', null, 'free', 'thing'], ['cineva', 'cineva', 'indefinite', 'nom acc', '3', 'sg', null, 'free', 'any'],
  ['nimic', 'nimic', 'indefinite', 'nom acc', '3', 'sg', null, 'free', 'thing'], ['nimeni', 'nimeni', 'indefinite', 'nom acc', '3', 'sg', null, 'free', 'any'],
  ['totul', 'tot', 'indefinite', 'nom acc', '3', 'sg', null, 'free', 'thing'],
];
// form, rel (w.lang.en's relation names), layout (k.layouts relation) and inverse, case of the noun after it, space,
// lemma (a variant's base form: într- before un, o)
export const PREPOSITIONS = [
  ['pe', 'on', 'on', null, 'acc', 'static'], ['în', 'in', 'inside', null, 'acc', 'static'], ['într', 'in', 'inside', null, 'acc', 'static', 'în'], ['la', 'at', null, null, 'acc', 'static'],
  ['lângă', 'near', 'beside', null, 'acc', 'static'], ['sub', 'below', 'above', 'yes', 'acc', 'static'], ['peste', 'above', 'above', null, 'acc', 'static'],
  ['deasupra', 'above', 'above', null, 'gendat', 'static'], ['dedesubtul', 'below', 'above', 'yes', 'gendat', 'static'], ['între', 'between', null, null, 'acc', 'static'],
  ['în fața', 'in_front_of', 'behind', 'yes', 'gendat', 'static'], ['în spatele', 'behind', 'behind', null, 'gendat', 'static'], ['în jurul', 'around', 'around', null, 'gendat', 'static'],
  ['la stânga', 'left_of', 'left_of', null, 'gendat', 'static'], ['la dreapta', 'right_of', 'left_of', 'yes', 'gendat', 'static'],
  ['în afara', 'outside', null, null, 'gendat', 'static'], ['de-a lungul', 'along', null, null, 'gendat', 'path'], ['prin', 'across', null, null, 'acc', 'path'],
  ['cu', 'with', null, null, 'acc', null], ['de', 'of', null, null, 'acc', null], ['din', 'from', null, null, 'acc', 'source'], ['dintre', 'of', null, null, 'acc', null],
  ['spre', 'to', null, null, 'acc', 'direction'], ['către', 'to', null, null, 'acc', 'direction'], ['până la', 'until', null, null, 'acc', null],
  ['după', 'after', null, null, 'acc', null], ['înainte de', 'before', null, null, 'acc', null], ['pentru', 'for', null, null, 'acc', null],
  ['despre', 'about', null, null, 'acc', null], ['ca', 'like', null, null, 'acc', null],
];
// form, value, gender ("m f n" when one form serves all), takes "de" before its noun (20 and over)
export const NUMERALS = [
  ['zero', 0], ['unu', 1, 'm n'], ['doi', 2, 'm'], ['două', 2, 'f n'], ['trei', 3], ['patru', 4], ['cinci', 5], ['șase', 6], ['șapte', 7], ['opt', 8], ['nouă', 9], ['zece', 10],
  ['unsprezece', 11, 'm n'], ['unsprezece', 11, 'f'], ['doisprezece', 12, 'm'], ['douăsprezece', 12, 'f n'], ['treisprezece', 13], ['paisprezece', 14], ['cincisprezece', 15], ['șaisprezece', 16],
  ['șaptesprezece', 17], ['optsprezece', 18], ['nouăsprezece', 19], ['douăzeci', 20], ['treizeci', 30], ['patruzeci', 40], ['cincizeci', 50], ['șaizeci', 60], ['șaptezeci', 70],
  ['optzeci', 80], ['nouăzeci', 90], ['sută', 100], ['mie', 1000],
].filter((x, i, a) => a.findIndex((y) => y[0] === x[0]) === i);
// form, kind, meaning (an English name of what it does in a request: and, or, then, negation, ...)
export const PARTICLES = [
  ['și', 'conjunction', 'and'], ['sau', 'conjunction', 'or'], ['ori', 'conjunction', 'or'], ['dar', 'conjunction', 'but'], ['iar', 'conjunction', 'and'],
  ['apoi', 'adverb', 'then'], ['după aceea', 'adverb', 'then'], ['că', 'conjunction', 'that'], ['dacă', 'conjunction', 'if'], ['când', 'conjunction', 'when'],
  ['să', 'particle', 'subjunctive'], ['s', 'particle', 'subjunctive'], ['decât', 'conjunction', 'than'], ['nici', 'conjunction', 'neither'], ['deci', 'conjunction', 'so'],
  ['nu', 'particle', 'negation'], ['da', 'particle', 'yes'], ['mai', 'adverb', 'more'], ['foarte', 'adverb', 'very'], ['prea', 'adverb', 'too'],
  ['înapoi', 'adverb', 'back'], ['sus', 'adverb', 'up'], ['jos', 'adverb', 'down'], ['acolo', 'adverb', 'there'], ['aici', 'adverb', 'here'], ['acum', 'adverb', 'now'],
  ['încă', 'adverb', 'again'], ['doar', 'adverb', 'only'], ['deja', 'adverb', 'already'], ['repede', 'adverb', 'fast'], ['încet', 'adverb', 'slowly'],
  ['de asemenea', 'adverb', 'also'], ['asemenea', 'adverb', 'also'], ['la fel', 'adverb', 'same'], ['unde', 'adverb', 'where'], ['cum', 'adverb', 'how'], ['de ce', 'adverb', 'why'],
  ['plus', 'adverb', 'plus'], ['minus', 'adverb', 'minus'], ['hai', 'interjection', 'lets'], ['salut', 'interjection', 'hello'], ['mersi', 'interjection', 'thanks'],
  ['te rog', 'interjection', 'please'], ['vă rog', 'interjection', 'please'],
];
// Realisation templates (std.morph `realise`): a reply in the cells the template names; `{x@y}` agrees with y.
export const TEMPLATES = [
  ['make', null, 'am desenat {kind:num=sg,case=nomacc,def=no} {colour@kind}'],
  ['remove', null, 'am șters {thing:num=sg,case=nomacc,def=yes}'],
  ['change', null, '{thing:num=sg,case=nomacc,def=yes} este acum {colour@thing}'],
];

// ---- the dictionary: lemma, class, gender (nouns), sense ----
// The sense is a wire id of k.words (word.pos.n: `house` = k.words.house.noun.1 for a noun class) or of k.actions
// (`@make.draw` = k.actions.verb.make.draw); `-` where k.words has no sense for it (the test reports
// the gap; the 9 of the first draft were added to k.words in block "16:10": italic, bold, thicken, numbered...). Written by hand for the app's commands and its Romanian
// examples.
export const LEXICON = `
copac m.cons m tree|cerc n.uri n circle|nor m.cons m cloud|soare m.e.oa m sun|casă f.ă f house|mașină f.ăi f car|barcă f.ăi.a f boat|stea f.ea f star
floare f.e.alt f flower|pisică f.ăi f cat|câine m.e m dog|pătrat n.e n square|triunghi n.uri n triangle|linie f.ie f line|punct n.e n point|inimă f.ăi f heart
pom m.cons m tree|munte m.e m mountain|lună f.ăi f moon|pește m.e m fish|pasăre f.e.alt f bird|cal m.cons m horse|vacă f.ăi f cow|om m.cons m person
copil m.cons m child|fată f.ă.e f girl|băiat m.cons m boy|bărbat m.cons m man|femeie f.ie f woman|dragon m.cons m dragon|elefant m.cons m elephant|păianjen m.cons m spider
țestoasă f.ă f turtle|ușă f.ăi f door|fereastră f.ăi f window|acoperiș n.uri n roof|perete m.e m wall|drum n.uri n road|râu n.uri n river|lac n.uri n lake
cer n.uri n sky|pământ n.uri n earth|nisip n.uri n sand|apă f.ă f water|zăpadă f.ă f snow|frunză f.ă f leaf|munte m.e m mountain
desen n.e n drawing|grafic n.e n chart|titlu n.u n title|paragraf n.e n paragraph|listă f.ă f list|document n.e n document|pagină f.ăi f page|text n.e n text
hartă f.ăi.a f map|editor n.e.oa n editor|ecran n.e n screen|filă f.ă f tab|tablă f.ă f board|avatar n.uri n avatar|joc n.uri n game|șah n.uri n chess
muzică f.ăi f music|cântec n.e n song|voce f.e f voice|limbă f.ăi f language|viteză f.ă f speed|culoare f.e.alt f colour|formă f.ă f shape|mărime f.e f size
element n.e n element|lucru n.u n thing|bară f.ă f bar|bulină f.ă f dot|propoziție f.ie f sentence|frază f.ă f sentence|literă f.ă f letter
număr n.e.ă n number|procent n.e n percent|total n.uri n total|medie f.ie f mean|legendă f.ă f legend|coloană f.ă f column|rând n.uri n row|selecție f.ie f selection
colț n.uri n corner|margine f.e f edge|parte f.e.alt f part|bază f.ă f base|mijloc n.uri n middle|miez n.uri n core|jumătate f.e.alt f half
dreaptă f.ă f right|stângă f.ăi f left|mod n.uri n mode|plan n.uri n plan|jurnal n.e n journal|excursie f.ie f trip|rețetă f.ă f recipe|notiță f.ă f note
cumpărătură f.ăi f purchase|aliment n.e n food|lapte m.e n milk|ou n.uri n egg|pâine f.e f bread|măr n.e.ă n apple|pară f.ă.e f pear|prună f.ă f plum
banană f.ă f banana|portocală f.ă f orange|zi f.ă f day|noapte f.e.alt f night|săptămână f.ăi f week|lume f.e f world|apus n.uri n sunset|sunet n.e n sound
picior n.e.oa n leg|capitală f.ă f capital|grad n.e n degree|întrebare f.e.alt f question|spânzurătoare f.e.alt f gallows|ascultare f.e.alt f listening|vorbire f.e f speech|calculator n.e.oa n calculator
roșu a.u - red|galben a.1 - yellow|verde a.e - green|albastru a.ru - blue|negru a.ru - black|alb a.1 - white|mov a.inv - purple|roz a.inv - pink
maro a.inv - brown|portocaliu a.iu - orange|gri a.inv - grey|auriu a.iu - golden|mare a.e - big|mic a.1i - small|uriaș a.1 - huge|lung a.1i - long
scurt a.1 - short|înalt a.1 - tall|gros a.1.oa - thick|frumos a.1.oa - beautiful|nou a.1 - new|curat a.1 - clean|rapid a.1 - fast
circular a.1 - round|orizontal a.1 - horizontal|vertical a.1 - vertical|cursiv a.1 - italic|îngroșat a.1 - bold.adjective.2|numerotat a.1 - numbered|anterior a.1.oa - anterior.adjective.2|rotund a.1 - round
închis a.1 - dark|deschis a.1 - light|englez a.1 - english|puțin a.1 - little|mult a.1 - much|întors a.1.oa - turned|rar a.1 - rare|gol a.1.oa - empty
desena v.a.ez - @make.draw|adăuga v.a.ă - @make.add|pune v.e.s.n - @place.put|muta v.a - @place.move|elimina v.a - @remove.remove|face v.e - @make.make|arăta v.a.ă3 - @change.show|schimba v.a - @change.change
colora v.a.ez - @change.colour|șterge v.e.s.g - @remove.delete|deschide v.e.s.d - @load.open|închide v.e.s.d - @change.close|anula v.a.ez - @undo.undo|reface v.e - @redo.redo|picta v.a.ez - @make.paint|scrie v.e.iu - @save.write
salva v.a.ez - @save.save|copia v.a.iez - @copy.copy|dubla v.a.ez - @copy.duplicate|duplica v.a - @copy.duplicate|ascunde v.e.s.d - @change.hide|înlocui v.i.iesc - @change.replace|roti v.i.esc - @change.rotate|întoarce v.e.s.c - @change.turn
mări v.i.esc - @change.enlarge|micșora v.a.ez - @change.shrink|citi v.i.esc - @load.read|insera v.a.ez - @place.insert|sorta v.a.ez - @group.sort|seta v.a.ez - @change.set|grupa v.a.ez - @group.group|selecta v.a.ez - @pick.select
aranja v.a.ez - @group.arrange|alinia v.a.iez - @place.align|umple v.e.iu - @change.fill|explica v.a - @ask.explain|spune v.e.s.n - @ask.tell|da v.a - @send.give|lua v.a - @pick.take|uni v.i.esc - @connect.join
trasa v.a.ez - draw.verb.1|transforma v.a - transform|redenumi v.i.esc - @change.rename|scoate v.e.s.t - remove.verb.1|începe v.e - begin|termina v.a - end.verb.1|opri v.i.esc - stop|porni v.i.esc - start
vorbi v.i.esc - speak|juca v.a.u - play|cânta v.a - sing|asculta v.a - listen|dansa v.a.ez - dance|merge v.e.s.g - go|veni v.i.esc - come|duce v.e.s.c - take
vrea v.ea - want|putea v.ea.u - can.verb.1|avea v.ea - have|fi v.i.esc - be|vedea v.ea - see|plăcea v.ea.ă - like|prefera v.a - prefer|dori v.i.esc - want
amesteca v.a - mix|obține v.e.n - get|număra v.a - count|calcula v.a.ez - calculate|aduna v.a - add.verb.1|înmulți v.i.esc - multiply|împărți v.i.esc - divide|găti v.i.esc - cook
spăla v.a.ă3 - wash|trece v.e - pass|întâlni v.i.esc - meet|îngroșa v.a.oa - thicken|înota v.a.oa - swim|numi v.i.esc - name|așeza v.a.ez - sit|scăpa v.a.ă - escape|ruga v.a.u - ask.verb.1
trage v.e.s.g - pull|schimb n.uri n exchange|sfârșit n.uri n end.noun.1|nisipiu a.iu - sandy|radar n.e n radar|repeta v.a - repeat|alege v.e.s.g - choose|lipi v.i.esc - paste|construi v.i.iesc - build|purta v.a.u - wear|trimite v.e.s.t - send|construi v.i.iesc - build
`.trim().split(/\n|\|/).map((r) => r.trim()).filter(Boolean).map((r) => r.split(' ')).filter((x, i, a) => a.findIndex((y) => y[0] === x[0]) === i);
// The sense id of a row: `@act.verb` -> k.actions.verb.act.verb; `word` -> k.words.word.<pos>.1; `word.pos.n` as given.
const POS = { n: 'noun', a: 'adjective', v: 'verb' };
export const senseId = (cls, sense) => (sense === '-' ? '' : sense.startsWith('@') ? `k.actions.verb.${sense.slice(1)}` : /\.\d+$/.test(sense) ? `k.words.${sense}` : `k.words.${seg(sense)}.${POS[cls[0]] ?? 'noun'}.1`);
// The rows of the dictionary, sorted by folded lemma then lemma, as TSV lines.
export function dictionaryRows() {
  return LEXICON.map(([lemma, cls, gender, sense]) => [lemma, cls, gender === '-' ? '' : gender, senseId(cls, sense)])
    .sort((a, b) => (foldText(a[0]) < foldText(b[0]) ? -1 : foldText(a[0]) > foldText(b[0]) ? 1 : a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
}
export function dictionaryFiles() {
  const files = {};
  for (const r of dictionaryRows()) {
    const p = foldText(r[0])[0];
    files[`${p}.tsv`] ??= [`# w.lang.ro dictionary, lemmas whose folded spelling starts with "${p}": lemma<TAB>class<TAB>gender<TAB>sense`,
      '# source: hand-core 1 (written by hand in this repository for the app\'s commands; no dictionary imported)', '# license: CC0-1.0', '# script: tools/lang-ro-core.mjs'];
    files[`${p}.tsv`].push(r.join('\t'));
  }
  return Object.fromEntries(Object.entries(files).map(([k, v]) => [k, `${v.join('\n')}\n`]));
}

// ---- shards ----
const feats = (f) => Object.entries(f).flatMap(([k, v]) => (k === 'gender' && typeof v === 'string' && v.includes(' ') ? G(v).map((g) => [k, g]) : [[k, typeof v === 'number' ? v : v]]));
const altVals = (a) => (a === true ? [['alt', 'yes']] : Array.isArray(a) ? a.map((x) => ['alt', { string: x }]) : []);
// Wire ids in ASCII that keep diacritic letters apart (asta, ăsta): ă a2, â a3, î i3, ș s2, ț t2.
const ascii = (s) => seg(String(s).replace(/[ăâîșțşţ]/g, (c) => ({ ă: 'a2', â: 'a3', î: 'i3', ș: 's2', ț: 't2', ş: 's2', ţ: 't2' })[c]));
const cellKey = (f) => Object.entries(f).map(([k, v]) => `${k}_${v}`).join('.');
const cellId = (cls, f) => `${W}.ending.${ascii(cls)}.${cellKey(f)}`;
const head = (id, about) => header({ id: `${W}/shards/${id}`, about, sources: ['hand-core 1 (written by hand in this repository)'], license: 'CC0-1.0', script: 'tools/lang-ro-core.mjs' });
export function langRoShards() {
  const files = {};
  const classLines = CLASSES.map(([name, parent, drop, alts, pos, about]) => wire(`${W}.class.${ascii(name)}`, `${W}.class`,
    [['name', name], ['parent', parent ?? undefined], ['drop', drop ?? undefined], ...alts.map((a) => ['alt', { string: a }]), ['pos', pos], ['about', { string: about }]], SRC));
  const ids = new Set();
  const endingLines = [];
  for (const [name] of CLASSES) for (const [f, suffix, alt] of CELLS[name] ?? []) {
    const id = cellId(name, f);
    if (ids.has(id)) throw new Error(`duplicate cell ${id}`);
    ids.add(id);
    endingLines.push(wire(id, `${W}.ending`, [['class', name], ['suffix', suffix === '' ? '_' : suffix], ...altVals(alt), ...feats(f)], SRC));
  }
  files['morphology.sop'] = `${head('morphology', 'Romanian morphology as rules (std.morph): paradigm classes with inheritance and alternations, the cells of each class (features -> suffix), the vowels, spelling folds and the clitic joiner.')}\n${[
    '# vowels (for alternations at the last vowel), folds (a word written without diacritics), the clitic joiner',
    wire(`${W}.vowel.all`, `${W}.vowel`, [['text', { string: VOWELS }]], SRC),
    ...FOLDS.map(([a, b]) => wire(`${W}.fold.u${a.codePointAt(0).toString(16)}`, `${W}.fold`, [['from', { string: a }], ['to', { string: b }]], SRC)),
    ...SPLITS.map((s, i) => wire(`${W}.split.${i + 1}`, `${W}.split`, [['text', { string: s }]], SRC)),
    '', '# paradigm classes', ...classLines, '', '# cells', ...endingLines].join('\n')}\n`;
  const irr = [];
  for (const [lemma, cells] of IRREGULAR) for (const [f, form] of cells) {
    const id = `${W}.irregular.${ascii(lemma)}.${cellKey(f)}`;
    let n = 1;
    while (ids.has(n === 1 ? id : `${id}.v${n}`)) n++; // a second form of one cell (este, e)
    ids.add(n === 1 ? id : `${id}.v${n}`);
    irr.push(wire(n === 1 ? id : `${id}.v${n}`, `${W}.irregular`, [['lemma', lemma], ['form', form], ...feats(f)], SRC));
  }
  files['irregular.sop'] = `${head('irregular', 'the Romanian forms no paradigm class covers: the auxiliaries and suppletive verbs (fi, avea, vrea, da, lua, veni, vedea, împărți), imperatives that are not the 3rd person (fă, du, mergi, treci), and the plurals of zi, ou, om and the forms of nou.')}\n${irr.join('\n')}\n`;
  const uniq = (t) => { const seen = new Set(); return (form) => { const b = `${W}.${t}.${ascii(form)}`; if (seen.has(b)) throw new Error(`two ${t} facts ${form}`); seen.add(b); return b; }; };
  const did = uniq('det'), pid = uniq('pron'), rid = uniq('prep'), nid = uniq('numeral'), xid = uniq('particle');
  files['closed.sop'] = `${head('closed', 'the closed classes of Romanian: determiners and articles, pronouns (with their clitic forms), prepositions as relations (joined to w.lang.en and k.layouts by relation name), numerals with their value and gender, conjunctions, adverbs and particles of requests.')}\n${[
    '# determiners and articles (the definite article is a cell of the noun classes)',
    ...DETERMINERS.map(([form, lemma, kind, f]) => wire(did(form), `${W}.det`, [['form', form], ['lemma', lemma], ['kind', kind], ...feats(f)], SRC)),
    '', '# pronouns',
    ...PRONOUNS.map(([form, lemma, kind, kase, person, num, gender, clitic, refers]) => wire(pid(form), `${W}.pron`, [['form', form], ['lemma', lemma], ['kind', kind], ...G(kase).map((c) => ['case', c]), ['person', person ?? undefined], ['num', num ?? undefined], ['gender', gender ?? undefined], ['clitic', clitic], ['refers', refers]], SRC)),
    '', '# prepositions',
    ...PREPOSITIONS.map(([form, rel, layout, inverse, kase, space, lemma]) => wire(rid(form), `${W}.prep`, [['form', form.includes(' ') || form.includes('-') ? { string: form } : form], ['lemma', lemma], ['rel', rel], ['layout', layout ?? undefined], ['inverse', inverse ?? undefined], ['case', kase], ['space', space ?? undefined]], SRC)),
    '', '# numerals',
    ...NUMERALS.map(([form, value, gender]) => wire(nid(form), `${W}.numeral`, [['form', form], ['value', value], ...G(gender ?? 'm f n').map((g) => ['gender', g]), ['with_de', value >= 20 ? 'yes' : undefined]], SRC)),
    '', '# conjunctions, adverbs, particles and interjections of requests',
    ...PARTICLES.map(([form, kind, meaning]) => wire(xid(form), `${W}.particle`, [['form', form.includes(' ') ? { string: form } : form], ['kind', kind], ['meaning', meaning]], SRC)),
  ].join('\n')}\n`;
  files['templates.sop'] = `${head('templates', 'realisation templates of replies (std.morph realise): a role in the cell the template names, an adjective agreeing with its noun.')}\n${
    TEMPLATES.map(([act, shape, text]) => wire(`${W}.template.${act}`, `${W}.template`, [['act', act], ['shape', shape ?? undefined], ['text', { string: text }]], SRC)).join('\n')}\n`;
  return files;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const shards = langRoShards();
  writeShards(join(DIR, 'shards'), shards);
  const dict = dictionaryFiles();
  const ddir = join(DIR, 'dictionary');
  mkdirSync(ddir, { recursive: true });
  for (const f of readdirSync(ddir)) if (f.endsWith('.tsv')) rmSync(join(ddir, f));
  for (const [f, t] of Object.entries(dict)) writeFileSync(join(ddir, f), t);
  console.log(`${Object.keys(shards).length} shards, ${Object.keys(dict).length} dictionary files, ${dictionaryRows().length} lemmas`);
}
