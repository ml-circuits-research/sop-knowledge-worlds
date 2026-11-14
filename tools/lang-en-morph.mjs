// w.lang.en: English regular inflection as facts in the library's std.morph notation (reviewer block "02:55", from
// PSys2's thinning audit: the regular rules were not published, only the irregulars). Read with
// `morphOf(world, { types: TYPES })`, like w.lang.ro:
//   - paradigm classes (`w.lang.en.class`) and their cells (`w.lang.en.ending`): nouns -s, -es, -ies, -ves (where
//     regular: leaf, knife), the same form (clothes); verbs -s/-ed/-ing with -es, e-dropping, -ee, -ie, -ies,
//     consonant doubling (one class per doubled letter: stop, stopped, stopping) and c > ck (panic); adjectives
//     -er/-est with e-dropping, -ier, doubling (big, bigger), and the class of adjectives compared with more/most;
//   - irregular forms in std.morph's shape (`w.lang.en.irregular_form lemma= form= <cell>`): the verbs and adjectives
//     of IRREGULAR_VERBS and IRREGULAR_ADJECTIVES (written here), and the irregular plurals, derived from
//     `w.lang.en.irregular` (which stays their home; `from` names the fact). A form for reading only (antennae, burnt
//     beside burned) carries `variant=yes`: generation asks for the cell without it and gets the regular form;
//   - the dictionary (`dictionary/<letter>.tsv`, `lemma<TAB>class`): every noun, verb and adjective of k.words (single
//     lower-case words) and every one-word verb of k.actions, with its class: by spelling, and by WordNet's exception
//     lists where spelling cannot tell (stop doubles, visit does not; leaf takes -ves, roof does not);
//   - ordered suffix rules (`w.lang.en.inflect`, the library's `inflectBy`) for the verb and adjective forms of words
//     no dictionary has: op third, past, ing, comparative, superlative (the plural rules were already published).
// Deterministic. Needs WordNet 3.1's exception lists (sources/wordnet/raw, see sources/wordnet/SOURCE.md).
//   node tools/lang-en-morph.mjs
import { readFileSync, readdirSync, rmSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, WORLDS_DIR, factsOf } from './lib/worlds.mjs';
import { wire, header, seg, byText } from './import/lib.mjs';

const W = 'w.lang.en';
const SRC = 'hand-core 1', WN = 'wordnet 3.1';
export const DIR = join(WORLDS_DIR, W);
export const RAW = join(REPO, 'sources/wordnet/raw/wordnet31');
// The library's morph types, renamed into this world.
export const TYPES = { cls: `${W}.class`, ending: `${W}.ending`, irregular: `${W}.irregular_form` };

// ---- paradigm classes: name, parent, drop, alternations, part of speech, what it is ----
const DOUBLE_VERB = 'bdgklmnprstvz'.split(''); // letters a verb doubles (stop, stopped)
const DOUBLE_ADJ = 'bdglmnpt'.split('');
const MONO_DOUBLE = 'bdgmnprt'.split(''); // the letters a verb of one syllable doubles by default (not l, s, z, k, v: WordNet says)
export const CLASSES = [
  ['noun.s', null, null, [], 'noun', 'plural -s (cat, cats)'],
  ['noun.es', 'noun.s', null, [], 'noun', 'plural -es: after s, x, z, ch, sh, and some -o (box, boxes; potato, potatoes)'],
  ['noun.ies', null, 'y', [], 'noun', 'a consonant and y: plural -ies (berry, berries)'],
  ['noun.ves', null, 'f', [], 'noun', 'f > ves (leaf, leaves; wolf, wolves)'],
  ['noun.fe', null, 'fe', [], 'noun', 'fe > ves (knife, knives; life, lives)'],
  ['noun.same', null, null, [], 'noun', 'a noun of plural form, the same in both numbers (clothes, arms, physics)'],
  ['verb.s', null, null, [], 'verb', '-s, -ed, -ing (walk, walks, walked, walking)'],
  ['verb.es', 'verb.s', null, [], 'verb', '-es after s, x, z, ch, sh and o (push, pushes; go, goes)'],
  ['verb.e', null, 'e', [], 'verb', 'a silent e dropped before -ed and -ing (make, makes, making; bake, baked)'],
  ['verb.ee', 'verb.s', null, [], 'verb', 'ee, ye, oe keep the e before -ing and take -d (agree, agreed, agreeing; dye, dyeing)'],
  ['verb.ie', null, 'ie', [], 'verb', 'ie > y before -ing (die, dies, died, dying)'],
  ['verb.ies', null, 'y', [], 'verb', 'a consonant and y: -ies, -ied, -ying (carry, carries, carried, carrying)'],
  ['verb.double', 'verb.s', null, [], 'verb', 'the last consonant doubled before -ed and -ing (one class per letter below)'],
  ...DOUBLE_VERB.map((c) => [`verb.double.${c}`, 'verb.double', null, [`${c}>${c}${c}@end`], 'verb', `${c} doubled (${({ b: 'rob, robbed', d: 'nod, nodded', g: 'beg, begged', k: 'trek, trekked', l: 'cancel, cancelled', m: 'trim, trimmed', n: 'plan, planned', p: 'stop, stopped', r: 'prefer, preferred', s: 'gas, gassed', t: 'fit, fitted', v: 'rev, revved', z: 'whiz, whizzed' })[c]})`]),
  ['verb.ck', 'verb.double', null, ['c>ck@end'], 'verb', 'c > ck before -ed and -ing (panic, panicked, panicking)'],
  ['adj.er', null, null, [], 'adjective', '-er, -est (tall, taller, tallest)'],
  ['adj.e', null, 'e', [], 'adjective', 'a silent e dropped before -er and -est (large, larger, largest)'],
  ['adj.ier', null, 'y', [], 'adjective', 'a consonant and y: -ier, -iest (happy, happier, happiest)'],
  ['adj.double', 'adj.er', null, [], 'adjective', 'the last consonant doubled before -er and -est (one class per letter below)'],
  ...DOUBLE_ADJ.map((c) => [`adj.double.${c}`, 'adj.double', null, [`${c}>${c}${c}@end`], 'adjective', `${c} doubled (${({ b: 'drab, drabber', d: 'sad, sadder', g: 'big, bigger', l: 'cruel, crueller', m: 'dim, dimmer', n: 'thin, thinner', p: 'hip, hipper', t: 'hot, hotter' })[c]})`]),
  ['adj.more', null, null, [], 'adjective', 'compared with more and most (beautiful, more beautiful, most beautiful): no suffix cells'],
];
// ---- cells: class, suffix ("_": none), features, alt (yes: the class's alternations) ----
const N = (num) => ({ num }), V = (vform) => ({ vform }), A = (degree) => ({ degree });
export const ENDINGS = [
  ['noun.s', '_', N('sg')], ['noun.s', 's', N('pl')], ['noun.es', 'es', N('pl')],
  ['noun.ies', 'y', N('sg')], ['noun.ies', 'ies', N('pl')], ['noun.ves', 'f', N('sg')], ['noun.ves', 'ves', N('pl')],
  ['noun.fe', 'fe', N('sg')], ['noun.fe', 'ves', N('pl')], ['noun.same', '_', N('sg')], ['noun.same', '_', N('pl')],
  ['verb.s', '_', V('base')], ['verb.s', 's', V('third')], ['verb.s', 'ed', V('past')], ['verb.s', 'ed', V('past_participle')], ['verb.s', 'ing', V('ing')],
  ['verb.es', 'es', V('third')],
  ['verb.e', 'e', V('base')], ['verb.e', 'es', V('third')], ['verb.e', 'ed', V('past')], ['verb.e', 'ed', V('past_participle')], ['verb.e', 'ing', V('ing')],
  ['verb.ee', 'd', V('past')], ['verb.ee', 'd', V('past_participle')],
  ['verb.ie', 'ie', V('base')], ['verb.ie', 'ies', V('third')], ['verb.ie', 'ied', V('past')], ['verb.ie', 'ied', V('past_participle')], ['verb.ie', 'ying', V('ing')],
  ['verb.ies', 'y', V('base')], ['verb.ies', 'ies', V('third')], ['verb.ies', 'ied', V('past')], ['verb.ies', 'ied', V('past_participle')], ['verb.ies', 'ying', V('ing')],
  ['verb.double', 'ed', V('past'), true], ['verb.double', 'ed', V('past_participle'), true], ['verb.double', 'ing', V('ing'), true],
  ['verb.double.s', 'es', V('third'), true], ['verb.double.z', 'es', V('third'), true],
  ['adj.er', '_', A('positive')], ['adj.er', 'er', A('comparative')], ['adj.er', 'est', A('superlative')],
  ['adj.e', 'e', A('positive')], ['adj.e', 'er', A('comparative')], ['adj.e', 'est', A('superlative')],
  ['adj.ier', 'y', A('positive')], ['adj.ier', 'ier', A('comparative')], ['adj.ier', 'iest', A('superlative')],
  ['adj.double', 'er', A('comparative'), true], ['adj.double', 'est', A('superlative'), true],
  ['adj.more', '_', A('positive')],
];

// ---- irregular verbs (base, past, past participle; several forms of a cell: the first is written, the others are
// variants for reading), written here (hand-core 1). Compounds of these (understand, overcome) are derived where
// WordNet's verb exceptions have their forms.
export const IRREGULAR_VERBS = `
abide abode,abided abode,abided|arise arose arisen|awake awoke awoken|be was been|bear bore borne,born|beat beat beaten|become became become|begin began begun
bend bent bent|bet bet bet|beseech besought,beseeched besought,beseeched|bid bid,bade bid,bidden|bind bound bound|bite bit bitten|bleed bled bled|bless blessed,blest blessed,blest|blow blew blown|break broke broken
breed bred bred|bring brought brought|broadcast broadcast broadcast|build built built|burn burned,burnt burned,burnt
burst burst burst|buy bought bought|cast cast cast|catch caught caught|choose chose chosen|cling clung clung|come came come
cost cost cost|creep crept crept|cut cut cut|deal dealt dealt|dig dug dug|dive dived,dove dived|do did done|draw drew drawn
dream dreamed,dreamt dreamed,dreamt|drink drank drunk|dwell dwelt,dwelled dwelt,dwelled|drive drove driven|eat ate eaten|fall fell fallen|feed fed fed
feel felt felt|fight fought fought|find found found|flee fled fled|fling flung flung|fly flew flown|forbid forbade,forbad forbidden|forecast forecast,forecasted forecast,forecasted
forget forgot forgotten|forgive forgave forgiven|forsake forsook forsaken|freeze froze frozen|get got got,gotten
give gave given|go went gone|grind ground ground|grow grew grown|hang hung,hanged hung,hanged|have had had|hear heard heard|heave heaved,hove heaved,hove
hew hewed hewn,hewed|hide hid hidden|hit hit hit|hold held held|hurt hurt hurt|keep kept kept|kneel knelt,kneeled knelt,kneeled
knit knitted,knit knitted,knit|know knew known|lay laid laid|lead led led|lean leaned,leant leaned,leant|leap leaped,leapt leaped,leapt
learn learned,learnt learned,learnt|leave left left|lend lent lent|let let let|lie lay,lied lain,lied|light lit,lighted lit,lighted
lose lost lost|make made made|mean meant meant|meet met met|mow mowed mown,mowed|pay paid paid|plead pleaded,pled pleaded,pled
prove proved proven,proved|put put put|quit quit,quitted quit,quitted|read read read|rend rent rent|rid rid rid|ride rode ridden
ring rang rung|rise rose risen|run ran run|saw sawed sawn,sawed|say said said|see saw seen|seek sought sought|sell sold sold
send sent sent|set set set|sew sewed sewn,sewed|shake shook shaken|shave shaved shaved,shaven|shear sheared shorn,sheared|shed shed shed|shine shone,shined shone,shined
shoe shod,shoed shod,shoed|shoot shot shot|show showed shown,showed|shrink shrank shrunk,shrunken|shut shut shut|sing sang sung|sink sank sunk,sunken|sit sat sat
slay slew slain|sleep slept slept|slide slid slid|sling slung slung|slit slit slit|smell smelled,smelt smelled,smelt
smite smote smitten|sneak sneaked,snuck sneaked,snuck|sow sowed sown,sowed|speak spoke spoken|speed sped,speeded sped,speeded|spell spelled,spelt spelled,spelt
spend spent spent|spill spilled,spilt spilled,spilt|spin spun spun|spit spat,spit spat,spit|spotlight spotlit,spotlighted spotlit,spotlighted|split split split
spoil spoiled,spoilt spoiled,spoilt|spread spread spread|spring sprang sprung|stand stood stood|steal stole stolen
stick stuck stuck|sting stung stung|stink stank stunk|strew strewed strewn,strewed|stride strode stridden|strike struck struck
string strung strung|strive strove striven|swear swore sworn|sweep swept swept|swell swelled swollen,swelled|swim swam swum
swing swung swung|take took taken|teach taught taught|tear tore torn|tell told told|think thought thought|thrive thrived,throve thrived,thriven|throw threw thrown
thrust thrust thrust|tread trod trodden|wake woke woken|wear wore worn|weave wove woven|wed wed,wedded wed,wedded|weep wept wept
wet wet,wetted wet,wetted|win won won|wind wound wound|work worked,wrought worked,wrought|wring wrung wrung|write wrote written`.trim().split(/[|\n]/).map((l) => l.trim().split(' ')).map(([base, past, pp]) => [base, past.split(','), pp.split(',')]);
// Irregular present third persons (the rest of the paradigm by the class).
export const IRREGULAR_THIRD = [['be', 'is'], ['have', 'has']];
// Prefixes of compounds that inflect like their verb (understand, overcome, undo, rewrite, withdraw, foresee, mislead).
export const PREFIXES = ['under', 'over', 'with', 'fore', 'out', 'mis', 'up', 're', 'un', 'be', 'for', 'off', 'down', 'by', 'in', 'back', 'sub', 'inter'];
// Irregular adjectives (positive, comparative, superlative; the first form is written, others are variants).
export const IRREGULAR_ADJECTIVES = [['good', ['better'], ['best']], ['well', ['better'], ['best']], ['bad', ['worse'], ['worst']], ['ill', ['worse'], ['worst']],
  ['far', ['farther', 'further'], ['farthest', 'furthest']], ['little', ['less'], ['least']], ['many', ['more'], ['most']], ['much', ['more'], ['most']],
  ['old', ['older', 'elder'], ['oldest', 'eldest']]];

// ---- choices spelling cannot make, written here ----
// Nouns in -ch said with k (stomach, stomachs): noun.s, not noun.es.
export const CH_K = new Set(['stomach', 'monarch', 'epoch', 'patriarch', 'matriarch', 'eunuch', 'tech', 'loch', 'czech', 'oligarch', 'triptych', 'eparch', 'heptarch']);
// Verbs in -el and -al whose last syllable is stressed: they double the l in every spelling (compel, compelled).
export const STRESSED_L = new Set(['compel', 'expel', 'excel', 'propel', 'repel', 'rebel', 'dispel', 'impel', 'appal', 'enthral', 'befall', 'install', 'recall', 'enrol', 'corral']);
// Nouns in a consonant and s, or in -es, that are singular (lens, lenses): the others are of plural form (arms, mumps).
export const SINGULAR_S = new Set(['lens', 'summons', 'cyclops']);
// Adjectives of one syllable that are not compared with -er (ungradable, or compared with more), and two-syllable
// ones in -y or -ly that are not either.
export const ADJ_MORE = new Set(['real', 'right', 'wrong', 'dead', 'main', 'own', 'next', 'past', 'male', 'chief', 'prime', 'sole', 'mere', 'whole', 'top',
  'key', 'fake', 'full-time', 'live', 'due', 'just', 'vast', 'worth', 'such', 'same', 'last', 'first', 'each', 'both', 'mid', 'pro', 'pure', 'sure', 'aged', 'used',
  'only', 'daily', 'weekly', 'monthly', 'yearly', 'hourly', 'nightly', 'elderly', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety', 'twenty', 'thirty', 'forty',
  'many', 'very', 'any', 'ready', 'bloody', 'sorry', 'ugly', 'holy', 'in', 'cod', 'mum', 'rum', 'jet', 'mat', 'out', 'off', 'up', 'down', 'top', 'gay', 'pet', 'bum']);
// ...and a few of more syllables that are compared with -er (clever, narrow, simple are by rule).
export const ADJ_ER = new Set(['quiet', 'polite', 'common', 'handsome', 'pleasant', 'stupid', 'ugly', 'holy']);

const vowel = (ch) => 'aeiou'.includes(ch);
const PARTICIPLES = new Set(IRREGULAR_VERBS.flatMap(([, , pp]) => pp));
/** Syllables, roughly: groups of vowels (y counts), a silent final e not counted (but -le after a consonant is). */
export const syllables = (w) => {
  const groups = (w.match(/[aeiouy]+/g) || []).length;
  const silent = /[^aeiouy]e$/.test(w) && !/[^aeiouy]le$/.test(w) ? 1 : 0;
  return Math.max(1, groups - silent);
};

/** The class of a lemma by its spelling alone (the default; the exceptions of WordNet may change it). */
export function spellingClass(lemma, pos) {
  if (pos === 'noun') {
    if (/(ss|us|is|as|os|ys|zz)$/.test(lemma)) return 'noun.es';
    if (/(ics|news|[^aeious]s|es)$/.test(lemma) && lemma.length > 3 && !SINGULAR_S.has(lemma)) return 'noun.same';
    if (/(s|x|z|sh)$/.test(lemma) || (/ch$/.test(lemma) && !CH_K.has(lemma))) return 'noun.es';
    if (/[^aeiou]y$/.test(lemma)) return 'noun.ies';
    return 'noun.s';
  }
  if (pos === 'verb') {
    if (lemma === 'be') return 'verb.s'; // be, being (the rest is irregular)
    if (/ie$/.test(lemma)) return 'verb.ie';
    if (/(ee|ye|oe)$/.test(lemma)) return 'verb.ee';
    if (/e$/.test(lemma)) return 'verb.e';
    if (/[^aeiou]y$/.test(lemma)) return 'verb.ies';
    if (/(s|x|z|ch|sh)$/.test(lemma) || (/[^o]o$/.test(lemma))) return 'verb.es';
    return 'verb.s';
  }
  // adjectives: a past participle (cut, set, shut) is not compared with -er
  if ((ADJ_MORE.has(lemma) || PARTICIPLES.has(lemma)) && !ADJ_ER.has(lemma)) return 'adj.more';
  const n = syllables(lemma);
  const gradable = n === 1 || ADJ_ER.has(lemma) || (n === 2 && /([^aeiou]y|[^aeiou]le|er|ow)$/.test(lemma));
  if (!gradable || lemma.includes('-')) return 'adj.more';
  if (/[^aeiou]y$/.test(lemma)) return 'adj.ier';
  if (/e$/.test(lemma)) return 'adj.e';
  return 'adj.er';
}

// WordNet's exception file: form -> bases.
const readExc = (text) => {
  const byBase = new Map();
  for (const line of text.split('\n')) {
    const [form, ...bases] = line.trim().split(/\s+/);
    if (!form) continue;
    for (const b of bases) (byBase.get(b) || byBase.set(b, new Set()).get(b)).add(form);
  }
  return byBase;
};

/** The class of a lemma: spelling, changed where WordNet's exception list shows the stem changes (stop, stopped). */
export function classOf(lemma, pos, exc, { readOnly = new Set(), ungradable = new Set() } = {}) {
  const forms = pos === 'noun' && readOnly.has(lemma) ? new Set() : exc.get(lemma) ?? new Set(); // a plural for reading only (banjoes) is no class evidence
  const last = lemma.slice(-1);
  if (pos === 'adjective' && ungradable.has(lemma)) return 'adj.more';
  if (pos === 'noun') {
    if (forms.has(`${lemma.slice(0, -2)}ves`) && lemma.endsWith('fe')) return 'noun.fe';
    if (forms.has(`${lemma.slice(0, -1)}ves`) && lemma.endsWith('f')) return 'noun.ves';
    if (forms.has(`${lemma}es`) && /o$/.test(lemma)) return 'noun.es';
    return spellingClass(lemma, pos);
  }
  if (pos === 'verb') {
    if (last === 'c' && (forms.has(`${lemma}ked`) || forms.has(`${lemma}king`))) return 'verb.ck';
    if (DOUBLE_VERB.includes(last) && vowel(lemma.at(-2) ?? '') && (forms.has(`${lemma}${last}ed`) || forms.has(`${lemma}${last}ing`))) return `verb.double.${last}`;
    // one syllable, one vowel after a consonant before the last consonant: doubles though WordNet lists nothing (blog, bog)
    if (MONO_DOUBLE.includes(last) && syllables(lemma) === 1 && /(^|[^aeiou])[aeiou][^aeiouwxy]$/.test(lemma) && !/qu[aeiou].$/.test(lemma) && !forms.has(`${lemma}ed`) && !forms.size) return `verb.double.${last}`;
    return spellingClass(lemma, pos);
  }
  if (DOUBLE_ADJ.includes(last) && (forms.has(`${lemma}${last}er`) || forms.has(`${lemma}${last}est`))) return `adj.double.${last}`;
  if (/[^aeiou]y$/.test(lemma) && (forms.has(`${lemma.slice(0, -1)}ier`) || forms.has(`${lemma.slice(0, -1)}iest`))) return 'adj.ier';
  return spellingClass(lemma, pos);
}

// ---- the inflect rules for words no dictionary has (inflectBy: the first rule of an op by order that matches) ----
// Doubling by spelling: one vowel after a consonant before the last consonant (stop, big). Stress decides it in
// longer words, and spelling does not show stress; the rules leave out only endings that are never stressed in a
// verb that doubles (open, offer, reckon, travel, signal, blossom; not -et or -it: set, fit). The dictionary is exact;
// these rules are the guess for a word it lacks, their agreement with it is measured (tests/w.lang.en.morph.test.mjs).
const CVC = (c) => ['a', 'e', 'i', 'o', 'u'].map((v) => `${v}${c}`);
export const UNSTRESSED = ['en', 'er', 'on', 'el', 'al', 'or', 'om'];
const unstressed = (c) => UNSTRESSED.filter((u) => u.endsWith(c));
const doubling = (op, letters, end, more = []) => letters.map((c) => { const u = [...unstressed(c), ...more.filter((x) => x.endsWith(c))]; return [op, `double.${c}`, { suffix: CVC(c), after: 'consonant', ...(u.length ? { unless_suffix: u } : {}), add: `${c}${end}` }]; });
export const RULES = [
  ['third', 'y', { suffix: ['y'], after: 'consonant', drop: 1, add: 'ies' }],
  ['third', 'es', { suffix: ['s', 'x', 'z', 'ch', 'sh', 'o'], unless_suffix: ['oo'], add: 'es' }],
  ['third', 's', { add: 's' }],
  ['past', 'e', { suffix: ['e'], add: 'd' }],
  ['past', 'y', { suffix: ['y'], after: 'consonant', drop: 1, add: 'ied' }],
  ...doubling('past', 'bdgmnprt'.split(''), 'ed'),
  ['past', 'ed', { add: 'ed' }],
  ['ing', 'ie', { suffix: ['ie'], drop: 2, add: 'ying' }],
  ['ing', 'ee', { suffix: ['ee', 'ye', 'oe'], add: 'ing' }],
  ['ing', 'e', { suffix: ['e'], min_length: 3, drop: 1, add: 'ing' }],
  ...doubling('ing', 'bdgmnprt'.split(''), 'ing'),
  ['ing', 'ing', { add: 'ing' }],
  ...[['comparative', 'r', 'ier', 'er'], ['superlative', 'st', 'iest', 'est']].flatMap(([op, eEnd, yEnd, end]) => [
    [op, 'e', { suffix: ['e'], add: eEnd }],
    [op, 'y', { suffix: ['y'], after: 'consonant', drop: 1, add: yEnd }],
    ...doubling(op, 'bdgmnpt'.split(''), end, ['id']), // stupid, solid: adjectives in -id never double
    [op, end, { add: end }],
  ]),
];

const unq = (v) => String(v).replace(/^"|"$/g, '');
const LEMMA = /^[a-z][a-z-]*[a-z]$/;

/** The catalog's lemmas: { noun, verb, adjective } -> sorted lemmas (k.words senses; one-word k.actions verbs). */
export function catalogLemmas() {
  const by = { noun: new Set(), verb: new Set(), adjective: new Set() };
  const supers = new Map(); // adjective -> its senses' supersenses
  for (const f of factsOf('k.words', 'k.words.sense')) {
    const w = unq(f.attrs.word[0]), p = f.attrs.pos[0];
    if (!by[p] || !LEMMA.test(w)) continue;
    by[p].add(w);
    if (p === 'adjective') (supers.get(w) || supers.set(w, new Set()).get(w)).add(f.attrs.supersense?.[0]);
  }
  for (const f of factsOf('k.actions', 'k.actions.verb')) { const w = unq(f.attrs.text[0]); if (LEMMA.test(w)) by.verb.add(w); }
  // relational and participial adjectives (WordNet's adj.pert, adj.ppl: solar, played) are not compared with -er
  const ungradable = [...supers].filter(([, s]) => [...s].every((x) => x === 'adj.pert' || x === 'adj.ppl')).map(([w]) => w).sort(byText);
  return { ...Object.fromEntries(Object.entries(by).map(([p, s]) => [p, [...s].sort(byText)])), ungradable };
}

export function readExceptions(dir = RAW) {
  return { noun: readExc(readFileSync(join(dir, 'noun.exc'), 'latin1')), verb: readExc(readFileSync(join(dir, 'verb.exc'), 'latin1')), adjective: readExc(readFileSync(join(dir, 'adj.exc'), 'latin1')) };
}

const POS_OF_CLASS = Object.fromEntries(CLASSES.map(([name, , , , pos]) => [name, pos]));
const cellsOf = (() => { // class -> [{ suffix, feat, alt }] with inheritance
  const own = new Map();
  for (const [cls, suffix, feat, alt] of ENDINGS) (own.get(cls) || own.set(cls, []).get(cls)).push({ suffix: suffix === '_' ? '' : suffix, feat, alt: !!alt });
  const decl = new Map(CLASSES.map((c) => [c[0], c]));
  const memo = new Map();
  const get = (name) => {
    if (memo.has(name)) return memo.get(name);
    const [, parent, drop, alts] = decl.get(name);
    const p = parent ? get(parent) : { cells: [], drop: '', alts: [] };
    const cells = new Map(p.cells.map((c) => [JSON.stringify(c.feat), c]));
    for (const c of own.get(name) ?? []) cells.set(JSON.stringify(c.feat), c);
    const out = { cells: [...cells.values()], drop: drop ?? p.drop, alts: alts.length ? alts : p.alts };
    memo.set(name, out);
    return out;
  };
  return get;
})();
/** The regular form of a lemma in a class's cell (what std.morph's generate gives without irregulars). */
export function regularForm(lemma, cls, feat) {
  const c = cellsOf(cls);
  const cell = c.cells.find((x) => JSON.stringify(x.feat) === JSON.stringify(feat));
  if (!cell) return null;
  let stem = c.drop && lemma.endsWith(c.drop) ? lemma.slice(0, -c.drop.length) : lemma;
  if (cell.alt) for (const a of c.alts) { const [pair] = a.split('@'); const [from, to] = pair.split('>'); if (stem.endsWith(from)) stem = stem.slice(0, -from.length) + to; }
  return stem + cell.suffix;
}

/** The irregular verb entry of a lemma: its own, or that of the verb it is a compound of (WordNet confirming one form). */
export function irregularVerb(lemma, exc, depth = 0) {
  const own = IRREGULAR_VERBS.find(([b]) => b === lemma);
  if (own) return { base: lemma, past: own[1], pp: own[2], via: null };
  if (depth > 1) return null;
  const forms = exc.verb.get(lemma) ?? new Set();
  for (const p of PREFIXES) {
    if (!lemma.startsWith(p) || lemma.length - p.length < 2) continue;
    const e = irregularVerb(lemma.slice(p.length), exc, depth + 1); // misunderstand: mis + understand (under + stand)
    // WordNet confirms: it lists a form of the compound made from the verb's (overcame), or forms of the compound none
    // of which is regular (upsetting, and no upsetted: set, set, set); output, outputted is regular.
    if (e && (depth > 0 || [...e.past, ...e.pp].some((f) => forms.has(p + f)) || (forms.size && ![...forms].some((f) => f.endsWith('ed'))))) return { base: lemma, past: e.past.map((f) => p + f), pp: e.pp.map((f) => p + f), via: e.via ? `${e.base}, ${e.via}` : e.base };
  }
  return null;
}

/** Everything the tool writes: { rows: [lemma, class, pos], irregular: [{ lemma, form, feat, variant, from, source }], report }. */
export function build({ lemmas = catalogLemmas(), exc = readExceptions(), irregularPlurals = factsOf(W, `${W}.irregular`) } = {}) {
  const rows = [];
  const readOnly = new Set(irregularPlurals.filter((f) => unq(f.attrs.read_only?.[0] ?? '') === 'yes').map((f) => unq(f.attrs.singular[0])));
  const info = { readOnly, ungradable: new Set(lemmas.ungradable ?? []) };
  for (const pos of ['noun', 'verb', 'adjective']) for (const l of lemmas[pos]) rows.push([l, classOf(l, pos, exc[pos], info), pos]);
  rows.sort((a, b) => byText(a[0], b[0]) || byText(a[1], b[1]));
  const irregular = [];
  const classOfRow = new Map(rows.map(([l, c, p]) => [`${l}|${p}`, c]));
  const addForms = (lemma, cls, feat, forms, source, from = null) => forms.forEach((form, i) => {
    if (form === regularForm(lemma, cls, feat)) return; // the class gives it already
    irregular.push({ lemma, form, feat, variant: i > 0, source, from });
  });
  const viaCompound = [];
  for (const l of lemmas.verb) {
    const e = irregularVerb(l, exc);
    if (!e) continue;
    if (e.via) viaCompound.push(`${l} (${e.via})`);
    const cls = classOfRow.get(`${l}|verb`);
    addForms(l, cls, { vform: 'past' }, e.past, SRC);
    addForms(l, cls, { vform: 'past_participle' }, e.pp, SRC);
    for (const [b, f] of IRREGULAR_THIRD) if (b === l) addForms(l, cls, { vform: 'third' }, [f], SRC);
    if (l === 'be') addForms(l, cls, { vform: 'past' }, ['was', 'were'], SRC); // were: a variant of the past (number)
  }
  for (const l of lemmas.adjective) {
    const e = IRREGULAR_ADJECTIVES.find(([b]) => b === l);
    if (!e) continue;
    const cls = classOfRow.get(`${l}|adjective`);
    addForms(l, cls, { degree: 'comparative' }, e[1], SRC);
    addForms(l, cls, { degree: 'superlative' }, e[2], SRC);
  }
  // Irregular plurals: derived from w.lang.en.irregular, their home; a reading-only one is a variant.
  for (const f of irregularPlurals) {
    const sg = unq(f.attrs.singular[0]), pl = unq(f.attrs.plural[0]);
    if (sg === pl) { irregular.push({ lemma: sg, form: pl, feat: { num: 'pl' }, variant: false, source: unq(f.attrs['core.source'][0]), from: f.id }); continue; }
    irregular.push({ lemma: sg, form: pl, feat: { num: 'pl' }, variant: unq(f.attrs.read_only?.[0] ?? '') === 'yes', source: unq(f.attrs['core.source'][0]), from: f.id });
  }
  // From WordNet's exceptions, where its form follows a pattern of English and no class gives it: the plural of a
  // noun in -is (axis, axes) and of a hyphenated compound by its first part (brothers-in-law); an adjective's form
  // without y > i (dryer beside drier) is a variant. And a verb that doubles a final l in a longer word (travel,
  // travelled; WordNet lists the doubled forms) keeps the forms without doubling as variants (traveled).
  for (const l of lemmas.noun) for (const f of exc.noun.get(l) ?? []) {
    const parts = l.split('-');
    if ((l.endsWith('is') && f === `${l.slice(0, -2)}es`) || (parts.length > 1 && f === [regularForm(parts[0], classOf(parts[0], 'noun', exc.noun, info), { num: 'pl' }), ...parts.slice(1)].join('-'))) irregular.push({ lemma: l, form: f, feat: { num: 'pl' }, variant: false, source: WN, from: null });
  }
  for (const l of lemmas.adjective) for (const f of exc.adjective.get(l) ?? []) {
    for (const [end, degree] of [['er', 'comparative'], ['est', 'superlative']]) if (f === l + end && f !== regularForm(l, classOfRow.get(`${l}|adjective`), { degree })) irregular.push({ lemma: l, form: f, feat: { degree }, variant: true, source: WN, from: null });
  }
  for (const l of lemmas.verb) {
    const cls = classOfRow.get(`${l}|verb`);
    if (cls !== 'verb.double.l' || syllables(l) < 2 || !/[ae]l$/.test(l) || STRESSED_L.has(l)) continue;
    for (const vform of ['past', 'past_participle', 'ing']) irregular.push({ lemma: l, form: regularForm(l, 'verb.s', { vform }), feat: { vform }, variant: true, source: WN, from: null });
  }
  // dedupe (be's "was" twice), first wins
  const seen = new Set();
  const irr = irregular.filter((x) => { const k = `${x.lemma}|${x.form}|${JSON.stringify(x.feat)}`; if (seen.has(k)) return false; seen.add(k); return true; });
  // WordNet forms that neither a class nor an irregular gives (reported, not published)
  const unexplained = {};
  for (const pos of ['noun', 'verb', 'adjective']) {
    unexplained[pos] = [];
    for (const l of lemmas[pos]) {
      const forms = exc[pos].get(l);
      if (!forms) continue;
      const cls = classOfRow.get(`${l}|${pos}`);
      const made = new Set([...cellsOf(cls).cells.map((c) => regularForm(l, cls, c.feat)), ...irr.filter((x) => x.lemma === l).map((x) => x.form)]);
      for (const f of forms) if (!made.has(f)) unexplained[pos].push(`${f} (${l})`);
    }
  }
  const counts = {};
  for (const [, c] of rows) counts[c] = (counts[c] ?? 0) + 1;
  return { rows, irregular: irr, report: { lemmas: Object.fromEntries(Object.entries(lemmas).map(([p, l]) => [p, l.length])), rows: rows.length, classes: counts, irregular: irr.length, variants: irr.filter((x) => x.variant).length, viaCompound, unexplained } };
}

const featEntries = (feat) => Object.entries(feat);
const cellName = (feat) => Object.values(feat).join('_');
const HDR = (id, about, sources, license) => header({ id: `${W}/shards/${id}`, about, sources, license, script: 'tools/lang-en-morph.mjs' });

/** The shard and dictionary files: { shards: name -> text, dictionary: name -> text }. */
export function files(b = build()) {
  const rules = CLASSES.map(([name, parent, drop, alts, pos, about]) => wire(`${W}.class.${seg(name.replace(/\./g, '_'))}`, `${W}.class`, [['name', name], ['parent', parent], ['drop', drop], ...alts.map((a) => ['alt', { string: a }]), ['pos', pos], ['about', { string: about }]], SRC));
  const ends = ENDINGS.map(([cls, suffix, feat, alt]) => wire(`${W}.ending.${seg(cls.replace(/\./g, '_'))}.${cellName(feat)}`, `${W}.ending`, [['class', cls], ['suffix', suffix], ...(alt ? [['alt', 'yes']] : []), ...featEntries(feat)], SRC));
  const inflect = RULES.map(([op, name, r], i, all) => wire(`${W}.inflect.${op}.${seg(name.replace(/\./g, '_'))}`, `${W}.inflect`, [['op', op], ['order', all.filter((x, j) => x[0] === op && j <= i).length],
    ...(r.suffix ?? []).map((s) => ['suffix', s]), ['after', r.after], ...(r.unless_suffix ?? []).map((s) => ['unless_suffix', s]), ['min_length', r.min_length], ['drop', r.drop], ['add', r.add]], SRC));
  const shards = {};
  shards['morphology-classes.sop'] = `${HDR('morphology-classes', `English regular inflection in std.morph notation: ${CLASSES.length} paradigm classes (nouns, verbs, adjectives) and their ${ENDINGS.length} cells, read with morphOf(world, { types: { cls: 'w.lang.en.class', ending: 'w.lang.en.ending', irregular: 'w.lang.en.irregular_form' } }); and ${RULES.length} ordered suffix rules (op third, past, ing, comparative, superlative) for inflectBy, the guess for a word no dictionary has`, ['hand-core 1 (written in this repository)'], 'CC0-1.0')}
# paradigm classes
${rules.join('\n')}

# cells: features -> suffix ("_": none); alt=yes: the class's alternations apply
${ends.join('\n')}

# suffix rules for inflectBy (the first rule of an op by order that matches)
${inflect.join('\n')}
`;
  const irrLine = (x) => wire(`${W}.irregular_form.${seg(x.lemma)}.${cellName(x.feat)}${x.variant ? `.${seg(x.form)}` : ''}`, `${W}.irregular_form`, [['lemma', x.lemma], ['form', x.form], ...featEntries(x.feat), ...(x.variant ? [['variant', 'yes']] : []), ['from', x.from]], x.source);
  const sortIrr = (a, b) => byText(a.lemma, b.lemma) || byText(cellName(a.feat), cellName(b.feat)) || Number(a.variant) - Number(b.variant) || byText(a.form, b.form);
  const own = b.irregular.filter((x) => x.source !== WN).sort(sortIrr), wn = b.irregular.filter((x) => x.source === WN).sort(sortIrr);
  shards['irregular-forms.sop'] = `${HDR('irregular-forms', `${own.length} irregular forms in std.morph's shape (lemma, form, cell): the irregular verbs and adjectives of the catalog (written in tools/lang-en-morph.mjs; a compound like understand from stand where WordNet has its forms) and the irregular plurals of w.lang.en.irregular that are not WordNet's (\`from\` names the fact, which stays their home); variant=yes: read, never written (burnt beside burned)`, ['hand-core 1 (written in this repository)', 'psys2 78f45863 (the irregular plurals of PSys2\'s hand-over, CC0)'], 'CC0-1.0')}
${own.map(irrLine).join('\n')}
`;
  shards['irregular-forms-wordnet.sop'] = `${HDR('irregular-forms-wordnet', `${wn.length} irregular plurals in std.morph's shape, derived from the WordNet plurals of w.lang.en.irregular (shard core-plurals; \`from\` names the fact, which stays their home); variant=yes: read, never written (antennae)`, ['wordnet 3.1 (noun.exc, the noun exception list of Princeton WordNet 3.1)'], 'WordNet-3.0')}
${wn.map(irrLine).join('\n')}
`;
  const dictionary = {};
  const byLetter = new Map();
  for (const [l, c] of b.rows) (byLetter.get(l[0]) || byLetter.set(l[0], []).get(l[0])).push(`${l}\t${c}`);
  for (const [letter, lines] of [...byLetter].sort(([a], [x]) => byText(a, x))) dictionary[`${letter}.tsv`] = [
    `# w.lang.en dictionary, lemmas that start with "${letter}": lemma<TAB>class (a word of two parts of speech has a row for each)`,
    '# sources: wordnet 3.1 (the nouns, verbs and adjectives of k.words, and its exception lists for the classes spelling cannot tell); hand-core 1 (the one-word verbs of k.actions; the classes by spelling)',
    '# license: WordNet-3.0',
    '# script: tools/lang-en-morph.mjs',
    ...lines, ''].join('\n');
  return { shards, dictionary };
}

export function write(f = files()) {
  for (const [name, text] of Object.entries(f.shards)) writeFileSync(join(DIR, 'shards', name), text);
  const d = join(DIR, 'dictionary');
  mkdirSync(d, { recursive: true });
  for (const old of readdirSync(d)) if (old.endsWith('.tsv')) rmSync(join(d, old));
  for (const [name, text] of Object.entries(f.dictionary)) writeFileSync(join(d, name), text);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (!existsSync(join(RAW, 'verb.exc'))) { console.error(`no WordNet exception lists in ${RAW}: see sources/wordnet/SOURCE.md`); process.exit(1); }
  const b = build();
  write(files(b));
  const { unexplained, viaCompound, ...rest } = b.report;
  console.log(JSON.stringify(rest));
  console.log(`compounds: ${viaCompound.length}: ${viaCompound.join(', ')}`);
  for (const [p, l] of Object.entries(unexplained)) console.log(`unexplained ${p} ${l.length}: ${l.join(', ')}`);
}
