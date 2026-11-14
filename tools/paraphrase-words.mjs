// k.words coverage of the content words of the first host's failing paraphrases (block "21:05" item 3).
//   node tools/paraphrase-words.mjs [--json]
// The paraphrases: sources/psys2-eval/paraphrase-failures.jsonl (the rows of its failures.jsonl whose class starts
// with "paraphrase:"). A content word is a word that is not a closed-class word of w.lang.en (determiners, pronouns,
// prepositions, auxiliaries, wh-words, numerals, conjunctions and the other closed lists) nor a number. It reaches a
// sense when k.words has a sense of it, of a form k.words names (core.word: children -> child), or of its stem by the
// regular endings of English (-s, -es, -ies, -ed, -ing, -er, -est, -'s; a doubled consonant and a dropped e restored).
// A word that reaches none is a miss, with a cause from the list below where one is known (a name, a misspelling, a
// notation), else "no sense".
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, WORLDS_DIR, scanWorlds } from './lib/worlds.mjs';
import { parse } from './sopworld/sopworld.mjs';

const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
export const PARAPHRASES = join(REPO, 'sources/psys2-eval/paraphrase-failures.jsonl');
// The closed classes of w.lang.en whose words are not content words.
const CLOSED = ['w.lang.en.det', 'w.lang.en.pron', 'w.lang.en.anaphor', 'w.lang.en.prep', 'w.lang.en.prep.time', 'w.lang.en.aux', 'w.lang.en.wh', 'w.lang.en.neg',
  'w.lang.en.copula', 'w.lang.en.relpron', 'w.lang.en.joiner', 'w.lang.en.coord.sep', 'w.lang.en.numeral', 'w.lang.en.ordinal', 'w.lang.en.partitive', 'w.lang.en.other', 'w.lang.en.contraction', 'w.lang.en.answer'];
// Misses that are not words of English, by cause (checked by hand against the paraphrases; a word listed here that
// later reaches a sense is reported, so the list cannot hide a fixed word).
export const NOT_WORDS = {
  name: ['zoe', 'anah'],
  notation: ['c3'],
  misspelling: ['wat'],
  // closed-class words w.lang.en does not list yet (a conjunction, reflexives, fillers): block "21:05" item 5
  closed: ['if', 'myself', 'yourself', 'hey', 'um'],
};

// The endings of contractions (you're -> you + are): w.lang.en.contraction.ending.
export function contractionEndings(worlds = scanWorlds()) {
  return worlds.find((w) => w.id === 'w.lang.en').shards.flatMap((s) => parse(s.text)).filter((x) => x.type === 'w.lang.en.contraction.ending').map((x) => String(tok(x.attrs.ending[0])).toLowerCase());
}

export function closedWords(worlds = scanWorlds()) {
  const lang = worlds.find((w) => w.id === 'w.lang.en');
  const out = new Set();
  for (const s of lang.shards) for (const x of parse(s.text)) if (CLOSED.includes(x.type)) {
    for (const k of ['text', 'word', 'form', 'full']) for (const v of x.attrs[k] ?? []) for (const w of String(tok(v)).toLowerCase().split(/\s+/)) out.add(w);
  }
  return out;
}

// k.words: the words with a sense (lower case) and the forms that name one (core.word text -> means).
export function senseWords(worlds = scanWorlds()) {
  const words = new Map(), forms = new Map();
  for (const s of worlds.find((w) => w.id === 'k.words').shards) for (const x of parse(s.text)) {
    if (x.type === 'k.words.sense') {
      const w = String(tok(x.attrs.word[0])).toLowerCase();
      if (!words.has(w)) words.set(w, new Set());
      words.get(w).add(x.attrs.pos[0]);
    } else if (x.type === 'core.word') for (const t of x.attrs.text ?? []) forms.set(String(tok(t)).toLowerCase(), String(tok(x.attrs.means[0])).toLowerCase());
  }
  return { words, forms };
}

// The stems of a word by the regular endings, the word first.
export function stems(w) {
  const out = [w];
  const add = (s) => { if (s.length >= 2 && !out.includes(s)) out.push(s); };
  const m = w.replace(/'s$/, '');
  add(m);
  if (/ies$/.test(m)) add(m.replace(/ies$/, 'y'));
  if (/(s|x|z|ch|sh|o)es$/.test(m)) add(m.slice(0, -2));
  if (/s$/.test(m) && !/ss$/.test(m)) add(m.slice(0, -1));
  for (const [end, keep] of [['ing', ''], ['ed', ''], ['er', ''], ['est', '']]) if (m.endsWith(end) && m.length > end.length + 2) {
    const b = m.slice(0, -end.length);
    add(b); add(`${b}e`);
    if (/([b-df-hj-np-tv-z])\1$/.test(b)) add(b.slice(0, -1));
    if (/i$/.test(b)) add(b.replace(/i$/, 'y'));
  }
  return out;
}

export function coverage({ worlds = scanWorlds(), rows = readFileSync(PARAPHRASES, 'utf8').trim().split('\n').map((l) => JSON.parse(l)) } = {}) {
  const closed = closedWords(worlds), { words, forms } = senseWords(worlds), endings = contractionEndings(worlds);
  // a word without its possessive 's and without the ending of a contraction
  const bare = (w) => { const m = w.replace(/'s$/, ''); const e = endings.find((x) => m.endsWith(x) && m.length > x.length); return e ? m.slice(0, -e.length) : m; };
  const reach = (w) => { for (const s of [...stems(w), bare(w)]) { if (words.has(s)) return s; if (forms.has(s) && words.has(forms.get(s))) return forms.get(s); } return null; };
  const cause = (w) => Object.entries(NOT_WORDS).find(([, ws]) => ws.includes(w) || ws.includes(bare(w)))?.[0] ?? 'no sense';
  const seen = new Map();
  for (const r of rows) for (const raw of r.text.toLowerCase().replace(/’/g, "'").match(/[a-z][a-z0-9'-]*/g) ?? []) {
    for (const w of raw.split('-').filter(Boolean)) {
      if (closed.has(w) || closed.has(bare(w)) || /^\d/.test(w)) continue;
      if (!seen.has(w)) seen.set(w, { word: w, count: 0, sense: reach(w), texts: [] });
      const e = seen.get(w);
      e.count++;
      if (e.texts.length < 2 && !e.texts.includes(r.text)) e.texts.push(r.text);
    }
  }
  const all = [...seen.values()].sort((a, b) => (a.word < b.word ? -1 : 1));
  const misses = all.filter((e) => !e.sense).map((e) => ({ ...e, cause: cause(e.word) }));
  return { rows: rows.length, words: all.length, reached: all.length - misses.length, misses, listedButReached: Object.values(NOT_WORDS).flat().filter((w) => seen.get(w)?.sense) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = coverage();
  if (process.argv.includes('--json')) console.log(JSON.stringify(r, null, 1));
  else {
    console.log(`${r.rows} paraphrases, ${r.words} content words, ${r.reached} reach a sense, ${r.misses.length} do not`);
    for (const m of r.misses) console.log(`  ${m.word} (${m.cause}, ${m.count}x): ${m.texts[0]}`);
    if (r.listedButReached.length) console.log(`listed as not words but reach a sense: ${r.listedButReached.join(', ')}`);
  }
}
