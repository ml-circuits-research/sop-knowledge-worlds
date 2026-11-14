// PSys2's English grammar hand-over (handover/lang.en, CC0) -> the reusable world w.lang.en (reviewer, Round 12,
// blocks 2026-11-14 01:00 and 01:20). Deterministic. Reads the files with `git show <commit>:<path>` from a checkout
// of PSys2 (never changes it) and writes docs/worlds/w.lang.en/shards/*.sop.
//   node tools/import/psys2-lang-en.mjs [--from /tmp/wt2] [--commit <sha>]
// What it changes against the hand-over, by this repository's rules (AGENTS.md):
// - names: every type and id under w.lang.en (rule 4); keys with "_" instead of "-".
// - no notation inside values (rule 3): a list in one value ("subject,object") becomes repeated keys; a grammar rule
//   with `? * +` and `[a|b]` becomes plain productions (one per optional part left out or kept; a repeated part is a
//   helper category with two rules; a word or a set of words is a category of its own, whose words are
//   `w.lang.en.word` facts); a frame pattern ("L V.make D {thing:words}") becomes one `w.lang.en.part` fact per
//   part; a range "2..5" becomes min and max; a regular expression becomes an ending and the words it stands for.
// - every wire has core.source; references to PSys2 code (`from=`, `read=`) go to comments, not to facts.
// - what is about one application (tabs: `tab-only`, `tab-priority`) is left out and listed in WORLD.md.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { parse } from '../sopworld/sopworld.mjs';
import { WORLDS_DIR } from '../lib/worlds.mjs';
import { wire, header, seg, text } from './lib.mjs';

const DIR = join(WORLDS_DIR, 'w.lang.en');
const P = 'w.lang.en';
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const vals = (w, k) => (w.attrs[k] ?? []).map(tok);
const one = (w, k) => vals(w, k)[0];
const kk = (k) => k.replace(/-/g, '_');
// "what_s" -> "what's", "i_d_like" -> "i'd like", "off_the_list" -> "off the list": PSys2 writes a space as "_" and drops the apostrophe
export const words = (s) => String(s).split('_').reduce((out, p, i) => (i > 0 && /^(s|d|ll|ve|re|m|t)$/.test(p) && /^[a-z]+$/.test(out[out.length - 1] ?? '') ? [...out.slice(0, -1), `${out[out.length - 1]}'${p}`] : [...out, p]), []).join(' ');

export function importLangEn(read, commit) {
  const SRC = `psys2 ${commit}`;
  const shards = {};
  const notes = { left: [], changed: [] };
  const put = (name, about, lines) => {
    shards[`${name}.sop`] = `${header({ id: `${P}/shards/${name}`, about, sources: [`${SRC} (PSys2 handover/lang.en and worlds/*/lexicon.sop: the English grammar of the demo, the project's own data)`], license: 'CC0-1.0', script: 'tools/import/psys2-lang-en.mjs' })}\n${lines.join('\n')}\n`;
  };
  // a fact whose id would be that of a wire of the schema (the preposition "in" and the slot w.lang.en.prep.in) gets ".word"
  const taken = new Set(parse(read.schema ?? '').map((w) => w.id));
  const W = (id, type, entries) => wire(taken.has(`${P}.${id}`) ? `${P}.${id}.word` : `${P}.${id}`, `${P}.${type}`, entries, SRC);
  const shard = (f) => parse(read(`handover/lang.en/shards/${f}.sop`));
  const copy = (w, skip = []) => Object.entries(w.attrs).filter(([k]) => !k.startsWith('core.') && !skip.includes(k)).flatMap(([k, vs]) => vs.map(tok).flatMap((v) => (/^[\w-]+(,[\w-]+)+$/.test(String(v)) && !['note', 'doc', 'example'].includes(k) ? v.split(',') : [v]).map((x) => [kk(k), x])));
  const idOf = (w, prefix) => w.id.slice(prefix.length);

  // ---- closed classes ----
  const det = shard('determiners').map((w) => W(`det.${idOf(w, 'lang.en.det.')}`, 'det', copy(w)));
  put('determiners', 'determiners, quantifiers and the small numerals that start a noun phrase; `in` names the PSys2 list (view) a word belongs to', det);

  const pr = shard('pronouns');
  put('pronouns', 'personal, possessive and demonstrative pronouns (what each refers to) and the anaphoric noun phrases of a dialogue ("that one", tried in `order`)', [
    ...pr.filter((w) => w.type === 'lang.en.pron').map((w) => W(`pron.${idOf(w, 'lang.en.pron.')}`, 'pron', copy(w))),
    ...pr.filter((w) => w.type === 'lang.en.anaphor').map((w) => W(`anaphor.${idOf(w, 'lang.en.anaphor.')}`, 'anaphor', copy(w).map(([k, v]) => [k, k === 'text' ? text(v) : v]))),
  ]);

  const preps = shard('prepositions');
  put('prepositions', 'prepositions as relations: `rel` the relation, `space` place, goal, source or way, `role` the roles that are not places; temporal prepositions as orders on a line of time', [
    ...preps.filter((w) => !one(w, 'time')).map((w) => W(`prep.${idOf(w, 'lang.en.prep.')}`, 'prep', copy(w).map(([k, v]) => [k, k === 'text' ? words(v) : v]))),
    ...preps.filter((w) => one(w, 'time')).map((w) => W(`prep.time.${idOf(w, 'lang.en.prep.')}`, 'prep.time', copy(w, ['time']).map(([k, v]) => [k, k === 'text' ? words(v) : v]))),
  ]);
  notes.changed.push('the temporal prepositions (`time=yes`) are a type of their own, `w.lang.en.prep.time`, so that a grammar reads them as their own category (TPREP); `next_to`, `earlier_than` are written "next to", "earlier than"');

  const nums = shard('numbers');
  put('numbers', 'ordinals and small cardinals a reader needs before the catalog is reachable; the whole system of number words is k.values.number, and these agree with it (a test)', nums.map((w) => (w.type === 'lang.en.ordinal' ? W(`ordinal.${idOf(w, 'lang.en.ordinal.')}`, 'ordinal', copy(w)) : W(`numeral.${idOf(w, 'lang.en.numeral.')}`, 'numeral', copy(w)))));

  // ---- morphology ----
  const mo = shard('morphology');
  const morph = [];
  for (const w of mo) {
    if (w.type === 'lang.en.inflect') {
      const e = copy(w, ['suffix-pattern', 'pattern', 'replace-suffix']);
      const sp = one(w, 'suffix-pattern');
      if (sp) { const [after, suf] = sp.split('+'); e.push(['suffix', suf], ['after', after]); }
      if (one(w, 'pattern') === 'us-plural') e.push(['exception', 'us-plural']);
      morph.push(W(`inflect.${idOf(w, 'lang.en.inflect.')}`, 'inflect', e));
    } else if (w.type === 'lang.en.irregular') morph.push(W(`irregular.${idOf(w, 'lang.en.irregular.')}`, 'irregular', copy(w)));
    else if (w.type === 'lang.en.noun.exception') morph.push(W(`noun.exception.${idOf(w, 'lang.en.noun.')}`, 'noun.exception', copy(w)));
    else if (w.type === 'lang.en.contraction') morph.push(W(`contraction.${idOf(w, 'lang.en.contraction.')}`, 'contraction', copy(w).map(([k, v]) => [k, text(v)])));
    else if (w.type === 'lang.en.contraction.rule') { // "(.+)n't" -> "$1 not": a word that ends so is the word without the ending, then `word`
      const m = /^\(\.\+\)(.+)$/.exec(one(w, 'pattern')), x = /^\$1 (.+)$/.exec(one(w, 'expands'));
      morph.push(W(`contraction.ending.${seg(m[1].replace("'", ''))}`, 'contraction.ending', [['ending', text(m[1])], ['word', x[1]]]));
    }
  }
  notes.changed.push('the contraction rules "(.+)n\'t" -> "$1 not" became `w.lang.en.contraction.ending ending="n\'t" word=not`; the plural rule "consonant+y" became `suffix=y after=consonant`; `pattern=us-plural` became `exception=us-plural` (the nouns of kind us-plural-suffix and us-plural-word)');
  put('morphology', 'how an English word changes: singular and plural rules in order, irregular plurals, nouns that look plural and are not, contractions', morph);

  // ---- ellipsis markers ----
  const el = shard('ellipsis');
  put('ellipsis', 'how a fragment points back at an earlier sentence: lead and trail markers, whole-sentence repeats, the first words that make a message a full sentence, and the limits of verb ellipsis and one-anaphora', el.map((w) => {
    const t = w.type.slice('lang.en.'.length);
    if (t === 'ellipsis.param') {
      const v = one(w, 'value'), r = /^(\d+)\.\.(\d+)$/.exec(v);
      return W(`${t}.${idOf(w, 'lang.en.ellipsis.param.')}`, t, [['name', one(w, 'name')], ...(r ? [['min', r[1]], ['max', r[2]]] : [['value', v]]), ['doc', text(one(w, 'doc'))]]);
    }
    return W(`${t}.${seg(idOf(w, `lang.en.${t}.`))}`, t, copy(w).map(([k, v]) => [k, k === 'text' ? text(v) : v]));
  }));
  notes.changed.push('ranges such as `value=2..5` of the ellipsis limits became `min=2 max=5`');

  // ---- noun phrases: categories, constructions, productions ----
  const np = shard('np');
  const cl = shard('clauses');
  const g = grammar(np, cl, W, notes);
  put('grammar', 'the grammar as plain productions over categories (noun phrases, coordination, ellipsis, anaphora, questions), the English constructions they belong to, and the words of the categories that are words', g.lines);

  // ---- clauses ----
  const cls = [];
  for (const w of cl) {
    const t = w.type.slice('lang.en.'.length);
    if (['joiner.rule', 'correction.rule', 'neg.rule', 'imperative.rule', 'qframe'].includes(t)) continue; // constructions (grammar shard)
    const name = idOf(w, `lang.en.${t}.`);
    if (t === 'joiner') cls.push(W(`joiner.${seg(name)}`, 'joiner', copy(w).map(([k, v]) => [k, k === 'text' || k === 'note' ? text(v) : v])));
    else if (t === 'frame-lead') cls.push(W(`frame_lead.${name}`, 'frame_lead', [['text', text(one(w, 'text'))]]));
    else if (t === 'neg' && one(w, 'pattern')) { // "(.+)n't": every n't contraction, and the same written without the apostrophe
      cls.push(W('neg.contracted', 'neg', [['ending', text("n't")], ...NO_APOSTROPHE.map((x) => ['text', x]), ['doc', text("every n't contraction (don't, isn't, can't, won't) is a negation; the same words written without the apostrophe are listed as `text` (an ending \"nt\" would also match want or plant)")]]));
    } else cls.push(W(`${t.replace(/-/g, '_')}.${seg(name)}`, t.replace(/-/g, '_'), copy(w, ['status', 'read']).map(([k, v]) => [k, ['text', 'doc', 'note'].includes(k) && /\s|'/.test(v) ? text(v) : v])));
  }
  notes.changed.push('the negation pattern "(.+)n\'t" became `ending="n\'t"` and the 16 contractions without apostrophe that PSys2 also counts (dont, isnt, cant ...) as words');
  put('clauses', 'clause structure: joiners and how they cut, frame leads, self-correction markers, bare answers, question words and auxiliaries, negation, the lead words of an imperative', cls);

  // ---- argument frames of the acts ----
  const fr = shard('frames-acts');
  const frames = framesOf(fr, W, notes);
  for (const [set, lines] of Object.entries(frames)) put(`frames-${set.replace(/\./g, '-')}`, `the argument frames of the acts of the set ${set}: one frame per way of saying an act, its parts in order (\`w.lang.en.part\`) and its fixed arguments`, lines);

  // ---- phrase groups and the lexicons the frames name ----
  const ph = shard('phrases');
  const phr = ph.map((w) => W(`phrase.${idOf(w, 'lang.en.phrase.')}`, 'phrase', [['name', idOf(w, 'lang.en.phrase.')], ['group', text(one(w, 'group'))], ['doc', text(one(w, 'doc'))], ...vals(w, 'item').map((x) => ['item', text(words(x))])]));
  notes.changed.push('phrase items are written with spaces and apostrophes ("i\'d like to"), not "i_d_like_to"; each phrase group has a `name`, which frames name with `phrase=`');
  // the phrase groups the frames name that the hand-over does not carry (the frames of undo and redo)
  for (const id of ['phrase.lang.undo', 'phrase.lang.redo']) {
    const w = parse(read('worlds/lang.common/lexicon.sop')).find((x) => x.id === id);
    const name = id.slice('phrase.lang.'.length);
    phr.push(W(`phrase.${name}`, 'phrase', [['name', name], ['group', text('request and question frames')], ['doc', text(one(w, 'doc'))], ...vals(w, 'alt').map((x) => ['item', text(words(x))])]));
  }
  const lex = [];
  for (const [file, id] of LEXICONS) {
    const w = parse(read(file)).find((x) => x.id === id);
    lex.push(W(`lex.${id.slice(4)}`, 'lex', [['name', id.slice(4)], ['doc', text(one(w, 'doc'))], ...vals(w, 'word').map((x) => ['item', text(words(x))])]));
  }
  put('phrases', 'phrase groups that say how English builds a request, a question, an answer or a negation (politeness, fillers, answers, degree and comparison; undo and redo from worlds/lang.common), and the four small lexicons the frames name', [...phr, ...lex]);
  return { shards, notes, stats: { frames: Object.values(frames).flat().length, rules: g.rules, constructions: g.constructions } };
}

const NO_APOSTROPHE = ['dont', 'doesnt', 'didnt', 'isnt', 'arent', 'wasnt', 'werent', 'cant', 'couldnt', 'wont', 'wouldnt', 'shouldnt', 'hasnt', 'havent', 'hadnt', 'aint'];
// The lexicons the frames name (`{amount:lex.space.amounts}`) that the hand-over does not carry: taken from the PSys2 worlds at the same commit.
const LEXICONS = [['worlds/space/lexicon.sop', 'lex.space.amounts'], ['worlds/acts/lexicon.sop', 'lex.acts.dir'], ['worlds/acts/lexicon.sop', 'lex.acts.layout'], ['worlds/lang.common/lexicon.sop', 'lex.lang.ordinal']];

// ---- the grammar -------------------------------------------------------------------------------------------------
// Words and word sets that rules name: each becomes a category whose words are w.lang.en.word facts.
const WORDCATS = {
  'all|every|each|both': 'QALL', everything: 'EVERYTHING', of: 'OF', "'s": 'POSS', 'this|that|these|those': 'DEM', 'one|ones': 'ONE', one: 'ONE1', ones: 'ONES',
  'except|but|apart_from': 'EXCEPT', 'back to': 'BACKTO', 'here|there|this|that': 'DEIXIS', 'how_many': 'HOWMANY', there: 'THERE', have: 'HAVE', why: 'WHY', the: 'THE',
};
// Closed classes: the category and the type whose `text` facts are its words.
export const CLASSES = { DET: 'det', NUM: 'numeral', ORD: 'ordinal', PREP: 'prep', TPREP: 'prep.time', PRON: 'pron', CONJ: 'coord.sep', RELPRON: 'relpron', COPULA: 'copula', PARTITIVE: 'partitive', OTHER: 'other', OR: 'choice', JOINER: 'joiner', LEAD: 'ellipsis.lead', TRAIL: 'ellipsis.trail', REPEAT: 'ellipsis.repeat', WH: 'wh', AUX: 'aux' };
const CATDOC = {
  MODS: 'one or more modifiers (MOD, MOD MODS)', NOUNS: 'one or two nouns read as one head (N, N NOUNS): chess board', NUMTAIL: 'a coordinated number after the first (CONJ NUM, CONJ NUM NUMTAIL)', STAIL: 'a clause after a joiner, once or more (JOINER S, JOINER S STAIL)',
  Q: 'a question', QALL: 'a quantifier over the whole set: all, every, each, both', EVERYTHING: 'the word everything', OF: 'the word of', POSS: "the possessive 's (a token of its own)", DEM: 'a demonstrative before one: this, that, these, those', ONE: 'one or ones standing for a noun', ONE1: 'the word one', ONES: 'the word ones',
  EXCEPT: 'a word that takes things out of a set: except, but, apart from', BACKTO: 'the words back to', DEIXIS: 'a word that points at the scene or the last answer: here, there, this, that', HOWMANY: 'the words how many', THERE: 'the word there', HAVE: 'the word have', WHY: 'the word why', THE: 'the word the',
  TPREP: 'a temporal preposition (prep.time)', RELPRON: 'a relative pronoun', COPULA: 'a form of be', PARTITIVE: 'a word before "of" that takes a part of a set', OTHER: 'the other, the others, another', OR: 'the word or', JOINER: 'a word that joins two clauses', LEAD: 'a fragment lead marker', TRAIL: 'a fragment trail marker', REPEAT: 'a whole-sentence repeat', WH: 'a question word', AUX: 'an auxiliary', AUXNEG: 'a negated auxiliary (isn\'t, don\'t)',
};
// Prose "rules" of the hand-over (no rhs): constructions said in words, applied by a function of the library (std-grammar.md names them).
const FUNCTION = { 'coord.part-start': 'grammar.split', 'coord.head-bound': 'grammar.split', 'coord.shared-suffix': 'grammar.shared', 'ellipsis.one-class': 'grammar.elide', 'ellipsis.one': 'grammar.elide', 'ellipsis.one-count': 'grammar.elide', 'ellipsis.one-bare': 'grammar.elide', 'ellipsis.verb': 'grammar.elide', 'ellipsis.fragment': 'grammar.fragment', 'ellipsis.repeat': 'grammar.fragment', 'ellipsis.number': 'grammar.fragment', 'ellipsis.answer': 'grammar.fragment', 'anaphora.focus': 'grammar.refer', 'anaphora.slot': 'grammar.refer', 'anaphora.back-to': 'grammar.refer', 'anaphora.agent': 'grammar.agent', 'anaphora.deictic': 'grammar.refer', 'joiner.run': 'grammar.clauses', 'coord.clause': 'grammar.clauses', 'correction.rule': 'grammar.clauses', 'neg.rule.same': null, 'neg.rule.aux': null, 'imperative.rule': 'grammar.read' };
// Holes of the hand-over that this repository fills (the facts are in shards/hand-*.sop): the status is not copied.
const FILLED = { 'q.tag': 'the negated auxiliaries (words of AUXNEG) and statements with be (construction s.copula) are in shards/hand-grammar.sop' };
const ROLE_EMITS = new Set(['thing', 'amount', 'n', 'name', 'ord', 'rel', 'place', 'set', 'part-of', 'anaphor', 'steps', 'modifiers', 'set-minus']);

function grammar(np, cl, W, notes) {
  const lines = [], wordFacts = new Map(), cats = new Map();
  let rules = 0, constructions = 0;
  for (const w of np.filter((x) => x.type === 'lang.en.cat')) cats.set(one(w, 'name'), one(w, 'doc'));
  const wordCat = (set) => {
    const c = WORDCATS[set];
    if (!c) throw new Error(`no category for the words ${set}`);
    for (const x of set.split('|')) { const t = words(x); (wordFacts.get(c) ?? wordFacts.set(c, new Set()).get(c)).add(t); }
    return c;
  };
  // one rhs part -> { cat, opt, many } (a part of several categories: { alts })
  const part = (raw) => {
    let t = raw.trim(), opt = false, many = false;
    const m = /^(.*?)([?*+])$/.exec(t);
    if (m && !/^\[.*\]$/.test(t)) { t = m[1]; opt = m[2] !== '+'; many = m[2] !== '?'; } else if (m && /\]$/.test(m[1])) { t = m[1]; opt = m[2] !== '+'; many = m[2] !== '?'; }
    if (/^\[.*\]$/.test(t)) t = t.slice(1, -1);
    if (t === 'CONJ NP') return { cat: 'NPTAIL', opt, many: false, helper: [['CONJ', 'NP'], ['CONJ', 'NP', 'NPTAIL']] };
    if (t === 'CONJ NUM') return { cat: 'NUMTAIL', opt, many: false, helper: [['CONJ', 'NUM'], ['CONJ', 'NUM', 'NUMTAIL']] };
    if (t === 'joiner S') return { cat: 'STAIL', opt, many: false, helper: [['JOINER', 'S'], ['JOINER', 'S', 'STAIL']] };
    if (/^[A-Z][A-Z-]*(\|[A-Z][A-Z-]*)+$/.test(t)) return { alts: t.split('|'), opt, many };
    if (t === 'lead' || t === 'trail' || t === 'repeat') return { cat: t.toUpperCase(), opt, many };
    if (t === 'joiner') return { cat: 'JOINER', opt, many };
    if (/^[A-Z]/.test(t) && !t.includes('|')) return { cat: t === 'NP.1' ? 'NP' : t, opt, many };
    if (t === ',') return null; // a comma is no token of a reader's words
    if (/^(some\|any\|many\|several\|a few\|one\|two\|\.\.\.)$/.test(t)) return { alts: ['PARTITIVE', 'NUM'], opt, many };
    if (t === 'the other|the others|another') return { cat: 'OTHER', opt, many };
    if (t === 'that|which|who') return { cat: 'RELPRON', opt, many };
    if (t === 'all|both|each|every|none') return { cat: 'PARTITIVE', opt, many };
    if (t === 'or') return { cat: 'OR', opt, many };
    if (t === 'one|ones' && many) return { cat: 'ONE', opt, many: false };
    return { cat: wordCat(t), opt, many: false };
  };
  const helper = new Map([['MOD', 'MODS'], ['N', 'NOUNS']]);
  const helpersUsed = new Map();
  // productions of one hand-over rule: every combination of optional parts kept or left out, alternatives spread
  const productions = (rhs) => {
    let out = [[]];
    for (const raw of rhs) {
      const p = part(raw);
      if (!p) continue;
      let cs = p.alts ?? [p.cat];
      if (p.many) cs = cs.map((c) => { const h = helper.get(c); if (!h) throw new Error(`no helper for ${c}*`); helpersUsed.set(h, [[c], [c, h]]); return h; });
      if (p.helper) helpersUsed.set(p.cat, p.helper);
      out = out.flatMap((v) => [...(p.opt ? [v] : []), ...cs.map((c) => [...v, c])]);
    }
    return out.filter((v) => v.length);
  };
  const construction = (name, e) => { constructions++; lines.push(W(`construction.${name}`, 'construction', [['name', name], ...e])); };
  const seen = new Map();
  let rule = (name, n, lhs, rhs, extra = []) => {
    const key = [lhs, ...rhs].join(' ');
    if (seen.has(key)) { notes.changed.push(`${name}: the production ${lhs} -> ${rhs.join(' ')} is already that of ${seen.get(key)}; it is written once (the construction stays, with its reading)`); return; }
    seen.set(key, name);
    // a fact holds a repeated key as a set: "rhs=NP rhs=OF rhs=NP" would keep NP once. A production that names a
    // category twice ends in a helper category that holds the rest (NP -> NP OFNP; OFNP -> OF NP).
    const dup = (xs) => new Set(xs).size < xs.length;
    if (dup(rhs)) {
      let s = rhs.length - 2;
      while (s > 0 && (dup(rhs.slice(0, s)) || dup(rhs.slice(s)))) s--;
      if (s < 1) throw new Error(`cannot factor ${rhs.join(' ')}`);
      const tail = rhs.slice(s), h = tail.join('');
      if (!helpersUsed.has(h)) { helpersUsed.set(h, [tail]); CATDOC[h] = `the rest of a production that names a category twice: ${tail.join(' ')}`; }
      notes.changed.push(`${name}: ${lhs} -> ${rhs.join(' ')} names a category twice; written ${lhs} -> ${[...rhs.slice(0, s), h].join(' ')} and ${h} -> ${tail.join(' ')} (a repeated key of a fact is a set)`);
      rhs = [...rhs.slice(0, s), h];
    }
    rules++; lines.push(W(`rule.${name}${n ? `.${n}` : ''}`, 'rule', [['lhs', lhs], ...rhs.map((c) => ['rhs', c]), ['construction', name], ...extra]));
  };
  lines.push('# ---- constructions and their productions ----');
  const rulesOf = [...np.filter((x) => x.type === 'lang.en.rule'), ...cl.filter((x) => ['lang.en.qframe', 'lang.en.joiner.rule', 'lang.en.correction.rule', 'lang.en.neg.rule', 'lang.en.imperative.rule'].includes(x.type))];
  for (const w of rulesOf) {
    const t = w.type.slice('lang.en.'.length);
    const name = t === 'rule' ? w.id.slice('lang.en.rule.'.length) : t === 'qframe' ? `q.${w.id.slice('lang.en.qframe.'.length)}` : w.id.slice('lang.en.'.length);
    const from = one(w, 'from');
    if (from) lines.push(`# ${name}: in PSys2, ${from}`);
    const emit = one(w, 'emit');
    const e = [];
    if (emit) {
      const ps = emit.split(',').map((x) => x.trim());
      if (ps.every((x) => ROLE_EMITS.has(x.split('=')[0]))) for (const x of ps) { const [k, v] = x.split('='); e.push(['emit', k]); if (v) e.push([k, v]); }
      else e.push(['reading', text(emit)]);
    }
    if (one(w, 'asks')) e.push(['asks', one(w, 'asks')]);
    const status = one(w, 'status') === 'hole' && !FILLED[name] ? 'hole' : null;
    if (one(w, 'status') === 'hole' && FILLED[name]) notes.changed.push(`${name}: no longer a hole: ${FILLED[name]}`);
    if (status) e.push(['status', 'hole']);
    if (FUNCTION[name]) e.push(['function', FUNCTION[name]]);
    if (one(w, 'doc')) e.push(['doc', text(one(w, 'doc'))]);
    for (const x of (one(w, 'example') ?? '').split(/;\s*/).filter((x) => x && !/^\(none/.test(x))) e.push(['example', text(x)]);
    // the rhs: a rule's rhs keys; a question frame's pattern (words split by spaces)
    let rhs = vals(w, 'rhs');
    if (t === 'qframe') rhs = one(w, 'pattern').split(/\s+/).map((x) => ({ 'AUX|did|do': 'AUX', 'AUX-NEG': 'AUXNEG', 'there?': 'there?', 'the': 'the', 'does': 'AUX' }[x] ?? x));
    const prose = !rhs.length || ['coord.shared-suffix', 'coord.part-start', 'coord.head-bound'].includes(name);
    const lhs = one(w, 'lhs') ?? (t === 'qframe' ? 'Q' : null);
    if (lhs && !/^[A-Z]+$/.test(lhs) && prose) e.unshift(['about', lhs.split('-')[0]]); else if (lhs) e.unshift(['about', lhs]);
    construction(name, e);
    if (prose) { if (rhs.length) notes.changed.push(`${name}: the rule "${rhs.join(' ')}" names parts that are no categories (a prefix and a suffix of a clause); it is a construction said in words, applied by ${FUNCTION[name]}`); continue; }
    const ps = productions(rhs);
    const head = one(w, 'head');
    const agree = one(w, 'agree');
    const extra = [...(head ? [['head', head === 'NP.1' ? 'NP' : head]] : []), ...(agree && agree !== 'none' ? [['agree', agree]] : []), ...(status ? [['status', 'hole']] : [])];
    ps.forEach((p, i) => rule(name, ps.length > 1 ? i + 1 : 0, lhs, p, extra));
  }
  for (const [h, prods] of [...helpersUsed].sort()) { construction(`helper.${h}`, [['about', h], ['doc', text(CATDOC[h])]]); prods.forEach((p, i) => rule(`helper.${h}`, i + 1, h, p)); }
  // the parts of the hand-over's np.sop that are words of categories
  lines.push('', '# ---- categories ----');
  const used = new Set(lines.filter((l) => / w\.lang\.en\.rule /.test(l)).flatMap((l) => [...l.matchAll(/ (?:lhs|rhs)=([A-Z][A-Z0-9]*)/g)].map((m) => m[1])));
  for (const c of [...new Set([...cats.keys(), ...used, ...Object.keys(CLASSES)])].sort()) lines.push(W(`cat.${c}`, 'cat', [['name', c], ['doc', text(cats.get(c) ?? CATDOC[c] ?? c)], ...(CLASSES[c] ? [['type', `w.lang.en.${CLASSES[c]}`]] : []), ...(c === 'NUM' ? [['digits', 'yes']] : []), ...(wordFacts.has(c) ? [['type', 'w.lang.en.word']] : [])]));
  lines.push('', '# ---- the words of the categories that are words ----');
  for (const [c, ws] of [...wordFacts].sort()) for (const t of [...ws].sort()) lines.push(W(`word.${c}.${seg(t.replace("'", 'q'))}`, 'word', [['text', text(t)], ['cat', c]]));
  lines.push('', '# ---- the small closed classes of the noun-phrase readings ----');
  for (const w of np.filter((x) => ['lang.en.relpron', 'lang.en.copula', 'lang.en.partitive', 'lang.en.other', 'lang.en.choice', 'lang.en.coord.sep', 'lang.en.coord.param'].includes(x.type))) {
    const t = w.type.slice('lang.en.'.length);
    const name = w.id.slice(`lang.en.${t}.`.length);
    if (t === 'coord.param') {
      const v = one(w, 'value');
      const e = [['name', one(w, 'name')]];
      if (/^\d+$/.test(v)) e.push(['value', v]);
      else if (v === '[0-9]+') e.push(['digits', 'yes']);
      else { const m = /^\^\(\[0-9\]\+\|(.+)\)\$$/.exec(v); e.push(['digits', 'yes'], ...m[1].split('|').map((x) => ['word', x])); }
      e.push(['doc', text(one(w, 'doc'))]);
      lines.push(W(`coord.param.${name}`, 'coord.param', e));
      continue;
    }
    lines.push(W(`${t}.${seg(name)}`, t, Object.entries(w.attrs).filter(([k]) => !k.startsWith('core.')).flatMap(([k, vs]) => vs.map(tok).map((v) => [kk(k), k === 'text' || k === 'doc' ? text(v) : v]))));
  }
  notes.changed.push('the regular expressions of the coordination parameters ("[0-9]+", "^([0-9]+|first|second|third|fourth|last)$") became `digits=yes` and repeated `word=`');
  // a negated auxiliary for the tag question (a hole in the hand-over: no words): the words, from English
  return { lines, rules, constructions };
}

// ---- frames --------------------------------------------------------------------------------------------------------
// PSys2 names two verb groups otherwise than k.actions names the act: V.set are the verbs of change, V.apart of take apart
const VERB_ACT = { set: 'change', apart: 'take apart' };
const LEXNAME = { ATTR: 'attribute', VALUE: 'value', KIND: 'kind', MORE: 'more', LESS: 'less', TURN: 'turn', FACTOR: 'factor', NOUN: 'noun' };
export function patternParts(pattern) {
  const out = [];
  for (const t0 of pattern.trim().split(/\s+/)) {
    let t = t0, optional = false;
    if (/\?$/.test(t) && !/^\{/.test(t)) { optional = true; t = t.slice(0, -1); }
    const p = {};
    if (t === 'L') Object.assign(p, { is: 'lead', phrase: ['lead.polite'], optional: true });
    else if (t === 'D') Object.assign(p, { is: 'det', optional: true });
    else if (t === 'REL') Object.assign(p, { is: 'role', role: 'rel', takes: 'prep' });
    else if (/^V\.\w+$/.test(t)) Object.assign(p, { is: 'verb', act: VERB_ACT[t.slice(2)] ?? t.slice(2) });
    else if (LEXNAME[t]) Object.assign(p, { is: 'lexicon', lexicon: LEXNAME[t] });
    else if (/^\{/.test(t)) {
      const m = /^\{(\w+):([\w.]+?)(?:\((\d+)\))?(\?)?\}$/.exec(t);
      if (!m) throw new Error(`capture ${t}`);
      const [, role, cls, max, opt] = m;
      Object.assign(p, { is: 'role', role });
      if (['words', 'rest', 'number'].includes(cls)) p.takes = cls;
      else if (LEXNAME[cls]) Object.assign(p, { takes: 'lexicon', lexicon: LEXNAME[cls] });
      else if (/^lex\./.test(cls)) Object.assign(p, { takes: 'lexicon', lexicon: cls.slice(4) });
      else throw new Error(`capture class ${cls}`);
      if (max) p.max_words = max;
      if (opt) optional = true;
    } else {
      const alts = /^\[.*\]$/.test(t) ? t.slice(1, -1).split('|') : [t];
      const phrase = alts.filter((a) => a.startsWith('$')).map((a) => a.slice(1).replace(/^lang\./, ''));
      const ws = alts.filter((a) => !a.startsWith('$')).map(words);
      Object.assign(p, phrase.length && !ws.length ? { is: 'phrase', phrase } : { is: 'word', word: ws, ...(phrase.length ? { phrase } : {}) });
    }
    if (optional) p.optional = true;
    out.push(p);
  }
  return out;
}
function framesOf(fr, W, notes) {
  const bySet = {};
  let tab = 0;
  const own = fr.filter((w) => one(w, 'act') === 'own');
  if (own.length) notes.left.push(`the ${own.length} frames of the act \`own\` (${own.map((w) => w.id.slice('lang.en.frame.'.length)).join(', ')}): no act of k.actions; they hand a sentence to a world's own reader (routing in one application), they say nothing of English`);
  for (const w of fr.filter((x) => one(x, 'act') !== 'own')) {
    const set = one(w, 'set'), name = w.id.slice('lang.en.frame.'.length);
    const e = [['name', name], ['act', one(w, 'act')], ['mode', one(w, 'mode')], ['set', set], ['priority', one(w, 'priority')], ['needs', one(w, 'needs')], ...vals(w, 'role').map((r) => ['role', r]), ['example', text(one(w, 'example'))]];
    if (one(w, 'tab-only') || one(w, 'tab-priority')) tab++;
    const lines = (bySet[set] ??= []);
    lines.push(W(`frame.${name}`, 'frame', e));
    patternParts(one(w, 'pattern')).forEach((p, i) => {
      const pe = [['frame', name], ['at', i + 1], ['is', p.is]];
      for (const k of ['act', 'role', 'takes', 'lexicon', 'max_words']) if (p[k] !== undefined) pe.push([k, k === 'act' && /\s/.test(p[k]) ? text(p[k]) : p[k]]);
      for (const x of p.word ?? []) pe.push(['word', text(x)]);
      for (const x of p.phrase ?? []) pe.push(['phrase', x]);
      if (p.optional) pe.push(['optional', 'yes']);
      lines.push(W(`part.${name}.${i + 1}`, 'part', pe));
    });
    for (const k of Object.keys(w.attrs).filter((x) => x.startsWith('lit.'))) lines.push(W(`fixed.${name}.${k.slice(4)}`, 'fixed', [['frame', name], ['role', k.slice(4)], ['value', text(one(w, k))]]));
  }
  notes.left.push(`\`tab-only\` and \`tab-priority\` of ${tab} frames: they say how the demo's tabs claim a sentence (an interface of one application)`);
  notes.changed.push('a frame `pattern` became one `w.lang.en.part` per part, in order (`at`): `is` lead, det, verb (with `act`), word (one of `word`), phrase (a phrase group), lexicon, or role (a capture: `role`, `takes` words, rest, number, prep or lexicon, `max_words`); `optional=yes` for `?`; the verb groups V.set and V.apart are the verbs of the acts change and take apart of k.actions; `lit.<role>=` became `w.lang.en.fixed frame= role= value=`');
  return bySet;
}

// ---- command line ----------------------------------------------------------------------------------------------------
if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = (k) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : undefined; };
  const from = arg('from') ?? '/tmp/wt2';
  // the commit cited by the last import (IMPORT.md), unless --commit names another: a checkout that moved on must not
  // change the cited source silently
  const cited = existsSync(join(DIR, 'IMPORT.md')) ? /from PSys2 commit `([0-9a-f]+)`/.exec(readFileSync(join(DIR, 'IMPORT.md'), 'utf8'))?.[1] : null;
  const commit = arg('commit') ?? cited ?? execFileSync('git', ['-C', from, 'rev-parse', '--short=8', 'HEAD'], { encoding: 'utf8' }).trim();
  const read = (path) => execFileSync('git', ['-C', from, 'show', `${commit}:${path}`], { encoding: 'utf8', maxBuffer: 1 << 26 });
  read.schema = readFileSync(join(DIR, 'schema.sop'), 'utf8');
  const { shards, notes, stats } = importLangEn(read, commit);
  const dir = join(DIR, 'shards');
  mkdirSync(dir, { recursive: true });
  for (const f of readdirSync(dir)) if (f.endsWith('.sop') && !/^(hand|core)-/.test(f)) rmSync(join(dir, f));
  for (const [f, t] of Object.entries(shards)) writeFileSync(join(dir, f), t);
  writeFileSync(join(DIR, 'IMPORT.md'), ['# What the import changed in the hand-over', '', `Generated by \`tools/import/psys2-lang-en.mjs\` from PSys2 commit \`${commit}\`; do not edit by hand.`, '', '## Changed (this repository\'s rules)', '', ...notes.changed.map((x) => `- ${x}`), '', '## Left out', '', ...notes.left.map((x) => `- ${x}`), ''].join('\n'));
  console.log(`${Object.keys(shards).length} shards; ${stats.frames} frame wires; ${stats.rules} productions; ${stats.constructions} constructions`);
}
