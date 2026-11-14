// Reading w.lang.en the way a host does, for tests and tools: the morphology rules as facts, and the options the
// library's std.grammar needs (which category is which type), built from the world's own `w.lang.en.cat` facts.
// The algorithms are the library's (std.grammar) or the host's; these are the smallest reference readings.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR } from './worlds.mjs';

const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const vals = (w, k) => (w.attrs[k] ?? []).map(tok);
const one = (w, k) => vals(w, k)[0];
const CONSONANT = /[bcdfghjklmnpqrstvwxz]$/;

// The singular or plural of a word by the facts { inflect, irregular, exceptions } (wires): irregulars first, then
// the first rule of the set by order that matches (the semantics written in schema.sop).
export function inflect({ inflect: rules, irregular = [], exceptions = [] }, word, op, set) {
  const w = String(word).toLowerCase();
  const irr = new Map(irregular.filter((x) => op === 'singular' || one(x, 'read_only') !== 'yes').map((x) => (op === 'singular' ? [one(x, 'plural'), one(x, 'singular')] : [one(x, 'singular'), one(x, 'plural')])));
  if (irr.has(w)) return irr.get(w);
  const exc = (kind, key) => exceptions.filter((x) => one(x, 'kind') === kind).map((x) => one(x, key));
  const mine = rules.filter((r) => one(r, 'op') === op && (op === 'plural' || one(r, 'set') === set)).sort((a, b) => Number(one(a, 'order')) - Number(one(b, 'order')));
  for (const r of mine) {
    if (one(r, 'min_length') && w.length < Number(one(r, 'min_length'))) continue;
    const sfx = vals(r, 'suffix');
    let hit = sfx.length ? sfx.find((s) => w.endsWith(s) && (one(r, 'after') !== 'consonant' || CONSONANT.test(w.slice(0, -s.length)))) : '';
    if (one(r, 'exception') === 'us-plural') hit = exc('us-plural-word', 'word').includes(w) || exc('us-plural-suffix', 'stem').some((s) => w.endsWith(`${s}es`)) ? 'es' : null;
    if (hit === undefined || hit === null) continue;
    if (vals(r, 'unless_suffix').some((s) => w.endsWith(s))) continue;
    if (one(r, 'unless_is_singular') === 'yes' && w.endsWith('is') && !exc('is-plural', 'stem').some((s) => w.endsWith(`${s}s`))) continue;
    const base = one(r, 'replace') != null && hit ? w.slice(0, w.length - hit.length) : w.slice(0, w.length - Number(one(r, 'drop') ?? 0));
    return base + (one(r, 'replace') ?? one(r, 'add') ?? '');
  }
  return w;
}

// The options of the library's parseText for a world that holds w.lang.en: rules, words, closed classes, digits.
export function hostOptions(world) {
  const classes = {};
  let digits;
  for (const c of world.ofType('w.lang.en.cat')) {
    const name = c.attrs.name[0], type = c.attrs.type?.[0];
    if (c.attrs.digits) digits = name;
    if (type && type !== 'w.lang.en.word') classes[name] = type;
  }
  return { types: { rule: 'w.lang.en.rule', word: 'w.lang.en.word' }, classes, digits };
}

// The open classes for the words of one sentence, from k.words (found through vocab.json, as a host finds a
// shard): a word that is no closed-class word gets N for a noun sense and MOD for an adjective sense of its singular.
const shardCache = new Map();
export function hostLexicon(world, sentence, worlds) {
  const vocab = JSON.parse(readFileSync(join(WORLDS_DIR, 'vocab.json'), 'utf8'));
  const closed = new Set();
  for (const t of Object.values(hostOptions(world).classes)) for (const w of world.ofType(t)) for (const x of w.attrs.text ?? []) closed.add(tok(x).toLowerCase());
  for (const w of world.ofType('w.lang.en.word')) closed.add(tok(w.attrs.text[0]).toLowerCase());
  const facts = { inflect: world.ofType('w.lang.en.inflect'), irregular: world.ofType('w.lang.en.irregular'), exceptions: world.ofType('w.lang.en.noun.exception') };
  const kwords = worlds.find((w) => w.id === 'k.words');
  const lex = {};
  for (const word of String(sentence).toLowerCase().match(/[a-z]+/g) ?? []) {
    if (closed.has(word)) continue;
    for (const lemma of [...new Set([inflect(facts, word, 'singular', 'lemma'), word])]) {
      if (lex[word]) break;
      for (const id of (vocab[lemma] ?? []).filter((s) => s.startsWith('k.words/'))) {
        if (!shardCache.has(id)) shardCache.set(id, kwords.shards.find((s) => s.id === id).text);
        const text = shardCache.get(id);
        const pos = new Set([...text.matchAll(new RegExp(`k\\.words\\.sense word=${lemma} pos=(\\w+)`, 'g'))].map((m) => m[1]));
        const es = [...(pos.has('noun') ? [{ cat: 'N', lemma }] : []), ...(pos.has('adjective') && lemma === word ? [{ cat: 'MOD', lemma }] : [])];
        if (es.length) lex[word] = [...(lex[word] ?? []), ...es].filter((e, i, a) => a.findIndex((x) => x.cat === e.cat) === i);
      }
    }
  }
  return lex;
}
