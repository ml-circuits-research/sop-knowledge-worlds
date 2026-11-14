// w.lang.en (Round 12): PSys2's English grammar hand-over, imported under this repository's rules, joined to
// k.words / k.actions / k.values, and read by the library's std.grammar (the one pinned build, tools/sopworld/VERSION; Q35).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { parse } from '../tools/sopworld/sopworld.mjs';
import { scanWorlds, REPO, WORLDS_DIR } from '../tools/lib/worlds.mjs';
import { World, parseText, nounPhrase, grammarView, viewDiff } from '../tools/sopworld/sopworld.mjs';
import { importLangEn, patternParts } from '../tools/import/psys2-lang-en.mjs';
import { inflect, hostOptions, hostLexicon } from '../tools/lib/lang-en.mjs';

const worlds = scanWorlds();
const lang = worlds.find((w) => w.id === 'w.lang.en');
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const wiresOf = (world, pred = () => true) => world.shards.filter(pred).flatMap((s) => parse(s.text));
const all = wiresOf(lang);
const of = (type) => all.filter((w) => w.type === `w.lang.en.${type}`);
const v = (w, k) => (w.attrs[k] ?? []).map(tok);
const one = (w, k) => v(w, k)[0];
const kw = (id, type) => wiresOf(worlds.find((w) => w.id === id)).filter((w) => w.type === type);

test('w.lang.en: std.grammar is read with the one pinned build, the same for every world (Q35)', () => {
  assert.equal(existsSync(join(REPO, 'tools/sopworld/grammar')), false);
  assert.equal(typeof parseText, 'function');
});

test('w.lang.en: the import is reproducible from the cited PSys2 commit (skipped without the checkout)', { skip: !existsSync('/tmp/wt2/.git') && 'no PSys2 checkout at /tmp/wt2' }, () => {
  const commit = /# sources: psys2 ([0-9a-f]+)/.exec(lang.shards[0].text)[1];
  const read = (path) => execFileSync('git', ['-C', '/tmp/wt2', 'show', `${commit}:${path}`], { encoding: 'utf8', maxBuffer: 1 << 26 });
  read.schema = lang.schemaText;
  const { shards } = importLangEn(read, commit);
  for (const [f, text] of Object.entries(shards)) assert.equal(text, readFileSync(join(WORLDS_DIR, 'w.lang.en/shards', f), 'utf8'), f);
});

test('w.lang.en: every wire has a source; no notation inside values', () => {
  const PROSE = new Set(['doc', 'example', 'note', 'reading', 'core.source', 'gloss']);
  const bad = [];
  for (const w of [...all, ...parse(lang.schemaText)]) {
    if (!w.attrs['core.source']) bad.push(`${w.id}: no core.source`);
    if (w.type.startsWith('core.')) continue;
    if (false) bad.push(`${w.id}: no core.source`);
    for (const [k, vs] of Object.entries(w.attrs)) if (!PROSE.has(k)) for (const x of vs.map(tok)) {
      // a list in one value, a set of choices, an optional or repeated mark, a range, a pattern, a "_" for a space
      if (/[|[\]{}*+]|\.\.|\$\d|^\^/.test(x) || (/,/.test(x) && x !== ',') || (/\?$/.test(x) && !/^\?/.test(x)) || (/_/.test(x) && k !== 'name' && k !== 'phrase' && !/^w\.lang\.en\./.test(x) && w.type !== 'core.slot')) bad.push(`${w.id} ${k}=${x}`);
    }
  }
  assert.deepEqual(bad, []);
});

test('w.lang.en: every category of a production is declared, and says where its words come from', () => {
  const cats = new Map(of('cat').map((c) => [one(c, 'name'), c]));
  const built = new Set(of('rule').map((r) => one(r, 'lhs')));
  const words = new Set(of('word').map((w) => one(w, 'cat')));
  const OPEN = new Set(['N', 'MOD', 'NAME', 'VP']); // the host's lexicon (k.words, k.actions, the worlds in play)
  for (const r of of('rule')) for (const c of [one(r, 'lhs'), ...v(r, 'rhs')]) assert.ok(cats.has(c), `${r.id}: category ${c}`);
  for (const [name, c] of cats) {
    const t = one(c, 'type');
    if (t && t !== 'w.lang.en.word') assert.ok(all.some((w) => w.type === t) , `${name}: facts of ${t}`);
    const holeOnly = of('rule').filter((r) => v(r, 'rhs').includes(name)).every((r) => one(r, 'status') === 'hole');
    assert.ok(built.has(name) || t || words.has(name) || OPEN.has(name) || holeOnly, `${name}: built by a rule, a class, words, or open (or named only by a hole)`);
  }
  for (const r of of('rule')) assert.equal(new Set(v(r, 'rhs')).size, v(r, 'rhs').length, `${r.id}: a category twice in a production is lost (a repeated key is a set)`);
  const constructions = new Set(of('construction').map((c) => one(c, 'name')));
  for (const r of of('rule')) assert.ok(constructions.has(one(r, 'construction')), r.id);
});

test('w.lang.en: frames have their parts in order, name acts and roles of k.actions, and phrase groups and lexicons that exist', () => {
  const acts = new Map(kw('k.actions', 'k.actions.act').map((a) => [one(a, 'name'), new Set(v(a, 'role'))]));
  const phrases = new Set(of('phrase').map((p) => one(p, 'name')));
  const lexicons = new Set([...of('lex').map((l) => one(l, 'name')), 'attribute', 'value', 'kind', 'more', 'less', 'turn', 'factor', 'noun']);
  const parts = new Map();
  for (const p of of('part')) (parts.get(one(p, 'frame')) ?? parts.set(one(p, 'frame'), []).get(one(p, 'frame'))).push(Number(one(p, 'at')));
  const roleMiss = new Map();
  for (const f of of('frame')) {
    const name = one(f, 'name');
    assert.ok(acts.has(one(f, 'act')), `${name}: act ${one(f, 'act')} of k.actions`);
    assert.deepEqual(parts.get(name).sort((a, b) => a - b), parts.get(name).map((_, i) => i + 1), `${name}: parts 1..n`);
    for (const r of v(f, 'role')) if (!acts.get(one(f, 'act')).has(r)) roleMiss.set(`${one(f, 'act')}.${r}`, (roleMiss.get(`${one(f, 'act')}.${r}`) ?? 0) + 1);
  }
  for (const p of of('part')) {
    if (one(p, 'is') === 'verb') assert.ok(acts.has(one(p, 'act')), `${p.id}: the verbs of ${one(p, 'act')}`);
    for (const x of v(p, 'phrase')) assert.ok(phrases.has(x), `${p.id}: phrase group ${x}`);
    if (one(p, 'lexicon')) assert.ok(lexicons.has(one(p, 'lexicon')), `${p.id}: lexicon ${one(p, 'lexicon')}`);
  }
  // the roles the frames fill that k.actions does not list for the act: the join is open there (WORLD.md)
  assert.deepEqual([...roleMiss.keys()].sort(), ROLES_NOT_IN_K_ACTIONS);
});
const SET_WORDS_NOT_IN_K_VALUES = ['every'];
const ROLES_NOT_IN_K_ACTIONS = JSON.parse(readFileSync(new URL('./w.lang.en.roles.json', import.meta.url), 'utf8'));

test('w.lang.en: a frame pattern of the hand-over and its parts', () => {
  assert.deepEqual(patternParts('L V.make D {thing:words} [called|named] {value:rest}'), [
    { is: 'lead', phrase: ['lead.polite'], optional: true }, { is: 'verb', act: 'make' }, { is: 'det', optional: true },
    { is: 'role', role: 'thing', takes: 'words' }, { is: 'word', word: ['called', 'named'] }, { is: 'role', role: 'value', takes: 'rest' }]);
  assert.deepEqual(patternParts('[what_s|let_s_have|i_d_like]? {amount:lex.space.amounts?} {rest:words(14)}'), [
    { is: 'word', word: ["what's", "let's have", "i'd like"], optional: true }, { is: 'role', role: 'amount', takes: 'lexicon', lexicon: 'space.amounts', optional: true },
    { is: 'role', role: 'rest', takes: 'words', max_words: '14' }]);
});

test('w.lang.en joins k.values: the numerals and ordinals agree with k.values.number', () => {
  const nums = kw('k.values', 'k.values.number');
  const value = (text, kind) => nums.find((n) => one(n, 'text') === text && one(n, 'kind') === kind)?.attrs.value?.[0];
  for (const n of of('numeral')) assert.equal(value(one(n, 'text'), 'cardinal'), one(n, 'value'), one(n, 'text'));
  for (const n of of('ordinal').filter((x) => one(x, 'text') !== 'last')) assert.equal(value(one(n, 'text'), 'ordinal'), one(n, 'value'), one(n, 'text'));
  for (const d of of('det').filter((x) => one(x, 'kind') === 'numeral')) assert.equal(value(one(d, 'text'), 'cardinal'), one(d, 'value'), one(d, 'text'));
  // the quantifiers over a whole set are set words of k.values
  const sets = new Set(kw('k.values', 'k.values.set_word').map((s) => one(s, 'name')));
  assert.deepEqual(of('word').filter((x) => one(x, 'cat') === 'QALL').map((w) => one(w, 'text')).filter((x) => !sets.has(x)), SET_WORDS_NOT_IN_K_VALUES);
});

test('w.lang.en joins k.words: the irregular plurals and the noun exceptions are words with a noun sense', () => {
  const vocab = JSON.parse(readFileSync(join(WORLDS_DIR, 'vocab.json'), 'utf8'));
  const noun = (w) => (vocab[w] ?? []).some((s) => s.startsWith('k.words/'));
  const missing = [...of('irregular').map((w) => one(w, 'singular')), ...of('noun.exception').filter((w) => one(w, 'kind') === 'is-plural').map((w) => one(w, 'stem'))].filter((w) => !noun(w));
  assert.ok(missing.length <= 12, `words not in k.words: ${missing.join(' ')}`);
});

test('w.lang.en: the morphology rules read plurals the way the hand-over says', () => {
  const set = { inflect: of('inflect'), irregular: of('irregular'), exceptions: of('noun.exception') };
  for (const [pl, sg] of Object.entries({ tables: 'table', boxes: 'box', cherries: 'cherry', wolves: 'wolf', cacti: 'cactus', kiwis: 'kiwi', octopuses: 'octopus', buses: 'bus', glass: 'glass', iris: 'iris' })) assert.equal(inflect(set, pl, 'singular', 'lemma'), sg, pl);
  for (const [sg, pl] of Object.entries({ table: 'tables', box: 'boxes', cherry: 'cherries', day: 'days', cactus: 'cacti' })) assert.equal(inflect(set, sg, 'plural'), pl, sg);
});

// What the library reads: the facts of w.lang.en, the classes named by its categories, open classes from k.words.
const gw = new World();
for (const s of lang.shards) assert.ok(gw.tell(s.text).ok, s.id);
const opts = hostOptions(gw);
const C = { det: 'DET', num: 'NUM', mod: 'MOD', head: 'N', pp: 'PP', ord: 'ORD', name: 'NAME', pron: 'PRON' };
const read = (s, start = 'NP') => parseText(gw, s, { ...opts, start, lexicon: hostLexicon(gw, s, worlds) });

test('w.lang.en is what the library reads: the noun-phrase examples parse with the right construction and head (open classes from k.words)', () => {
  const cases = {
    'the big red house': ['np.det-n', 'house'], '3 red tables': ['np.count-n', 'table'], 'the third table': ['np.ordinal', 'table'], 'the last circle': ['np.ordinal', 'circle'],
    'all the tables': ['np.all', 'table'], 'each guest': ['np.all', 'guest'], 'both eyes': ['np.all', 'eye'], everything: ['np.everything', undefined], 'the legs of the crocodile': ['np.possessive-of', 'leg'],
    "the house's door": ['np.possessive-s', 'door'], 'the star next to the house': ['np.pp', 'star'], it: ['np.pron', undefined], 'that one': ['np.dem-one', undefined],
    'some of the tables': ['np.quant-of', undefined], 'two of the houses': ['np.quant-of', undefined], 'all of the tables': ['np.quant-of', undefined], 'the table that is red': ['np.relative', 'table'],
    'the other table': ['anaphora.other', 'table'], 'table 1 or table 2': ['coord.or', 'table'], 'everything except the tree': ['coord.except', undefined], 'a sun and a cloud and a man': ['coord.np', 'sun'],
  };
  for (const [s, [construction, lemma]] of Object.entries(cases)) {
    const p = read(s);
    assert.ok(p.length, `parses: ${s} ${JSON.stringify(p.unknown ?? [])}`);
    const np = nounPhrase(p[0].tree, C);
    assert.equal(np.rule.replace(/^w\.lang\.en\.rule\./, '').replace(/\.\d+$/, ''), construction, s);
    assert.equal(np.lemma, lemma, s);
  }
});

test('w.lang.en is what the library reads: questions', () => {
  for (const [s, c] of Object.entries({ 'where is the cat': 'q.wh-aux-np', 'how many legs does a spider have': 'q.howmany-have', 'what is the colour of the table': 'q.wh-of', 'how many tables are there': 'q.howmany' })) {
    const p = read(s, 'Q');
    assert.ok(p.some((x) => x.tree.rule.includes(`.${c}`)), `${s}: ${p.map((x) => x.tree.rule)}`);
  }
});

test('w.lang.en is what the library reads: the views of a closed class and where they differ', () => {
  assert.deepEqual(grammarView(gw, 'w.lang.en.prep.time'), ['after', 'before', 'during', 'earlier than', 'later than', 'since', 'until']);
  const d = viewDiff(gw, 'w.lang.en.det', 'acts', 'discourse');
  assert.ok(d.only.acts.includes('another') && d.only.discourse.includes('his'), JSON.stringify(d));
});
