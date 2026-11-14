// w.lang.en (Round 12): PSys2's English grammar hand-over, imported under this repository's rules, joined to
// k.words / k.actions / k.values, and read by the library's std.grammar (the one pinned build, tools/sopworld/VERSION; Q35).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { parse } from '../tools/sopworld/sopworld.mjs';
import { scanWorlds, fullWorld, REPO, WORLDS_DIR } from '../tools/lib/worlds.mjs';
import { World, parseText, nounPhrase, grammarView, viewDiff } from '../tools/sopworld/sopworld.mjs';
import { importLangEn, patternParts, localPart } from '../tools/import/psys2-lang-en.mjs';
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
  const [, commit, localCommit] = /from PSys2 commit `([0-9a-f]+)` and `src\/lang\/en\.local\.mjs` at commit `([0-9a-f]+)`/.exec(readFileSync(join(WORLDS_DIR, 'w.lang.en/IMPORT.md'), 'utf8'));
  const read = (path, at = commit) => execFileSync('git', ['-C', '/tmp/wt2', 'show', `${at}:${path}`], { encoding: 'utf8', maxBuffer: 1 << 26 });
  read.schema = lang.schemaText;
  const { shards } = importLangEn(read, commit, { commit: localCommit, text: read('src/lang/en.local.mjs', localCommit) });
  for (const [f, text] of Object.entries(shards)) assert.equal(text, readFileSync(join(WORLDS_DIR, 'w.lang.en/shards', f), 'utf8'), f);
});

test('w.lang.en: every wire has a source; no notation inside values', () => {
  const PROSE = new Set(['doc', 'example', 'note', 'reading', 'core.source', 'gloss', 'about']);
  const WORDS = new Set(['text', 'word', 'item', 'singular', 'plural', 'stem', 'expands']); // keys that hold English words: a "_" there stands for a space
  const bad = [];
  for (const w of [...all, ...parse(lang.schemaText)]) {
    if (!w.attrs['core.source']) bad.push(`${w.id}: no core.source`);
    if (w.type.startsWith('core.')) continue;
    if (false) bad.push(`${w.id}: no core.source`);
    // a template's text is in the library's template notation (std.morph realise: {role}, {role:f=v}), the one
    // notation the reviewer asked for (block 17:05), read by the library, as in w.lang.ro
    const TEMPLATE = /^w\.lang\.en\.(template|discourse)$/.test(w.type);
    // an alternation's from and to are in the library's pattern notation ({x} spans; Q54 there, reviewer 21:55), without
    // its [a|b] alternatives (each alternative a fact): only the spans are allowed
    const PATTERN = (k) => w.type === 'w.lang.en.alternation' && (k === 'from' || k === 'to');
    for (const [k, vs] of Object.entries(w.attrs)) if (PATTERN(k)) { for (const x of vs.map(tok)) if (/[|[\]*+]/.test(x.replace(/\{[a-z_]+(:base)?\}/g, ''))) bad.push(`${w.id} ${k}=${x}`); }
    // a test sentence of an alternation is a sentence as typed ("could you open the door?")
    else if (!PROSE.has(k) && !(TEMPLATE && k === 'text') && !(w.type === 'w.lang.en.alternation_case' && (k === 'text' || k === 'canonical'))) for (const x of vs.map(tok)) {
      // a list in one value, a set of choices, an optional or repeated mark, a range, a pattern, a "_" for a space
      if (/[|[\]{}*+]|\.\.|\$\d|^\^/.test(x) || (/,/.test(x) && x !== ',') || (/\?$/.test(x) && !/^\?/.test(x)) || (/_/.test(x) && WORDS.has(k))) bad.push(`${w.id} ${k}=${x}`);
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
    // a category may take its words from another world (from_type, from_key: the verbs of k.actions, the positions of k.values)
    if (one(c, 'from_type')) { const w = worlds.find((x) => one(c, 'from_type').startsWith(`${x.id}.`)); assert.ok(w && w.shards.some((s) => s.text.includes(` ${one(c, 'from_type')} `) && s.text.includes(` ${one(c, 'from_key')}=`)), `${name}: ${one(c, 'from_type')} ${one(c, 'from_key')}`); }
    assert.ok(built.has(name) || t || words.has(name) || OPEN.has(name) || one(c, 'from_type') || holeOnly, `${name}: built by a rule, a class, words, from another world, or open (or named only by a hole)`);
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
  for (const f of of('frame')) {
    const name = one(f, 'name');
    // block 07:40: the frames of the act `own` hand a sentence to a world's own reader and name no act of k.actions
    if (one(f, 'act') === 'own') assert.ok(one(f, 'needs') === 'reader' && one(f, 'set') === 'acts', `${name}: own`);
    else assert.ok(acts.has(one(f, 'act')), `${name}: act ${one(f, 'act')} of k.actions`);
    if (one(f, 'after')) assert.ok(of('frame').some((g) => one(g, 'name') === one(f, 'after') && one(g, 'set') === one(f, 'set')), `${name}: after a frame of its set`);
    assert.deepEqual(parts.get(name).sort((a, b) => a - b), parts.get(name).map((_, i) => i + 1), `${name}: parts 1..n`);
  }
  for (const p of of('part')) {
    if (one(p, 'is') === 'verb') assert.ok(acts.has(one(p, 'act')), `${p.id}: the verbs of ${one(p, 'act')}`);
    for (const x of v(p, 'phrase')) assert.ok(phrases.has(x), `${p.id}: phrase group ${x}`);
    if (one(p, 'lexicon')) assert.ok(lexicons.has(one(p, 'lexicon')), `${p.id}: lexicon ${one(p, 'lexicon')}`);
  }
});

test('w.lang.en joins k.actions: every role of every frame is a role of its act in k.actions, by name or through a role_map', () => {
  const acts = new Map(kw('k.actions', 'k.actions.act').map((a) => [one(a, 'name'), new Set(v(a, 'role'))]));
  const maps = of('role_map');
  const partOf = (frame, role) => of('part').find((p) => one(p, 'frame') === frame && one(p, 'role') === role);
  let mapped = 0, same = 0;
  for (const f of of('frame').filter((x) => one(x, 'act') !== 'own')) for (const r of v(f, 'role')) {
    const name = one(f, 'name'), act = one(f, 'act'), takes = one(partOf(name, r) ?? { attrs: {} }, 'takes');
    const m = maps.find((x) => one(x, 'frame') === name && one(x, 'role') === r)
      ?? maps.find((x) => !one(x, 'frame') && one(x, 'act') === act && one(x, 'role') === r && one(x, 'takes') === takes)
      ?? maps.find((x) => !one(x, 'frame') && !one(x, 'takes') && one(x, 'act') === act && one(x, 'role') === r);
    const actRole = m ? one(m, 'act_role') : r;
    if (m) mapped++; else same++;
    assert.ok(acts.get(act).has(actRole), `${name}: ${r} -> ${act}.${actRole}`);
  }
  for (const m of maps) assert.ok(acts.get(one(m, 'act'))?.has(one(m, 'act_role')), m.id);
  assert.ok(mapped > 50 && same > 200, `${mapped} mapped, ${same} by name`);
});

test('w.lang.en joins k.actions: every marker of a role of k.actions is a preposition of w.lang.en (and is the conjunction of connect)', () => {
  const markers = new Set([...kw('k.actions', 'k.actions.role'), ...kw('k.actions', 'k.actions.marking')].flatMap((w) => v(w, 'marker')));
  const preps = new Set([...of('prep'), ...of('prep.time')].map((p) => one(p, 'text')));
  assert.deepEqual([...markers].filter((m) => !preps.has(m)), ['and']);
});

test('w.lang.en joins k.time: "Monday is before Friday", "December comes after November" by the order of k.time', () => {
  const time = fullWorld('k.time', worlds);
  const prep = (t) => { const ps = of('prep.time').filter((p) => one(p, 'text') === t); return Object.assign({}, ...ps.map((p) => Object.fromEntries(Object.entries(p.attrs).map(([k, x]) => [k, tok(x[0])])))); };
  // The first thing fills the key first_is, the second the key second_is; with `span` (until, since) the same time holds too.
  const holds = (a, t, b, more = {}) => { const p = prep(t);
    if (p.span && a === b) return true;
    const want = { [p.first_is]: a, [p.second_is]: b, ...more };
    return time.ofType(p.relation).some((w) => Object.entries(want).every(([k, x]) => tok(w.attrs[k]?.[0]) === x)); };
  for (const t of ['before', 'after', 'earlier than', 'later than', 'until', 'since', 'during']) {
    const p = prep(t);
    assert.ok(p.relation && p.first_is && p.second_is, t);
    assert.ok(time.schema(p.relation)?.keys[p.first_is] && time.schema(p.relation).keys[p.second_is], `${t}: keys of ${p.relation}`);
  }
  assert.equal(holds('Monday', 'before', 'Friday'), true);
  assert.equal(holds('Friday', 'before', 'Monday'), false);
  assert.equal(holds('December', 'after', 'November'), true);
  assert.equal(holds('spring', 'earlier than', 'summer'), true);
  // Round 12: until and since name the end and the start of a span; during, a span that holds the time.
  assert.equal(holds('Monday', 'until', 'Friday'), true);
  assert.equal(holds('Friday', 'until', 'Friday'), true, 'the end counts');
  assert.equal(holds('Saturday', 'until', 'Friday'), false);
  assert.equal(holds('Friday', 'since', 'Monday'), true);
  assert.equal(holds('Monday', 'since', 'Friday'), false);
  assert.equal(holds('January', 'during', 'winter', { hemisphere: 'north' }), true);
  assert.equal(holds('January', 'during', 'summer', { hemisphere: 'south' }), true);
  assert.equal(holds('January', 'during', 'summer', { hemisphere: 'north' }), false);
  assert.equal(holds('9 am', 'during', 'morning'), true);
  assert.equal(holds('3 pm', 'during', 'morning'), false);
  // block 07:40: spans on top of during: the weekend, the week and the year, dawn and dusk
  assert.equal(holds('Saturday', 'during', 'weekend'), true);
  assert.equal(holds('Monday', 'during', 'weekend'), false);
  assert.equal(holds('Monday', 'during', 'week'), true);
  assert.equal(holds('March', 'during', 'year'), true);
  assert.equal(holds('spring', 'during', 'year'), true);
  assert.equal(holds('dawn', 'during', 'morning'), true);
  assert.equal(holds('dusk', 'during', 'evening'), true);
  assert.equal(holds('evening', 'during', 'night'), false);
  assert.equal(of('construction').find((c) => one(c, 'name') === 'pp.time').attrs.status, undefined, 'no longer a hole');
});

test('w.lang.en joins k.layouts: a preposition that says a place names a relation of k.layouts', () => {
  const rels = kw('k.layouts', 'k.layouts.relation').map((r) => one(r, 'rel'));
  const preps = new Map();
  for (const p of of('prep')) preps.set(one(p, 'text'), { ...(preps.get(one(p, 'text')) ?? {}), ...Object.fromEntries(Object.entries(p.attrs).map(([k, x]) => [k, tok(x[0])])) });
  for (const [t, p] of preps) if (p.layout) assert.ok(rels.includes(p.layout), `${t}: ${p.layout}`);
  assert.deepEqual(['on', 'in', 'under', 'next to', 'to the right of', 'in front of'].map((t) => [preps.get(t).layout, preps.get(t).inverse ?? null]),
    [['on', null], ['inside', null], ['above', 'yes'], ['beside', null], ['left_of', 'yes'], ['behind', 'yes']]);
});

test('w.lang.en: a frame pattern of the hand-over and its parts', () => {
  assert.deepEqual(patternParts('L V.make D {thing:words} [called|named] {value:rest}'), [
    { is: 'lead', phrase: ['lead.polite'], optional: true }, { is: 'verb', act: 'make' }, { is: 'det', optional: true },
    { is: 'role', role: 'thing', takes: 'words' }, { is: 'word', word: ['called', 'named'] }, { is: 'role', role: 'value', takes: 'rest' }]);
  assert.deepEqual(patternParts('[what_s|let_s_have|i_d_like]? {amount:lex.space.amounts?} {rest:words(14)}'), [
    { is: 'word', word: ["what's", "let's have", "i'd like"], optional: true }, { is: 'role', role: 'amount', takes: 'lexicon', lexicon: 'space.amounts', optional: true },
    { is: 'role', role: 'rest', takes: 'words', max_words: '14' }]);
});

// The pattern of a frame written again from its parts, as a host that reads patterns writes it (the inverse of
// patternParts): `listed` keeps "[have]", `quotes` keeps "rest(quotes)".
const LEXROLE = { attribute: 'ATTR', value: 'VALUE', kind: 'KIND', more: 'MORE', less: 'LESS', turn: 'TURN', factor: 'FACTOR', noun: 'NOUN' };
const VERBS = { change: 'set', 'take apart': 'apart' };
const patternOf = (parts) => parts.map((p) => {
  const opt = one(p, 'optional') === 'yes' ? '?' : '';
  const chunk = (x) => x.replace(/[ ']/g, '_');
  const lex = (n) => LEXROLE[n] ?? `lex.${n}`;
  switch (one(p, 'is')) {
    case 'lead': return 'L';
    case 'det': return 'D';
    case 'verb': return `V.${VERBS[one(p, 'act')] ?? one(p, 'act')}`;
    case 'phrase': return `[${v(p, 'phrase').map((x) => `$lang.${x}`).join('|')}]${opt}`;
    case 'lexicon': return `${lex(one(p, 'lexicon'))}${opt}`;
    case 'word': { const ws = [...v(p, 'word').map(chunk), ...v(p, 'phrase').map((x) => `$lang.${x}`)]; return ws.length === 1 && !opt && one(p, 'listed') !== 'yes' ? ws[0] : `[${ws.join('|')}]${opt}`; }
    case 'role': {
      if (one(p, 'takes') === 'prep' && one(p, 'role') === 'rel') return 'REL';
      const arg = one(p, 'max_words') ?? (one(p, 'quotes') === 'yes' ? 'quotes' : null);
      return `{${one(p, 'role')}:${one(p, 'takes') === 'lexicon' ? lex(one(p, 'lexicon')) : one(p, 'takes')}${arg ? `(${arg})` : ''}${opt}}`;
    }
    default: throw new Error(one(p, 'is'));
  }
}).join(' ');

test('w.lang.en (block 07:40): every frame of src/lang/en.local.mjs is published, with parts that give its pattern back (skipped without the checkout)', { skip: !existsSync('/tmp/wt2/.git') && 'no PSys2 checkout at /tmp/wt2' }, () => {
  const [, localCommit] = /src\/lang\/en\.local\.mjs` at commit `([0-9a-f]+)`/.exec(readFileSync(join(WORLDS_DIR, 'w.lang.en/IMPORT.md'), 'utf8'));
  const src = execFileSync('git', ['-C', '/tmp/wt2', 'show', `${localCommit}:src/lang/en.local.mjs`], { encoding: 'utf8' });
  const local = parse(localPart(src, 'frames'));
  const partsOf = (name) => of('part').filter((p) => one(p, 'frame') === name).sort((a, b) => one(a, 'at') - one(b, 'at'));
  for (const w of local) {
    const name = one(w, 'name');
    const f = of('frame').find((x) => one(x, 'name') === name);
    assert.ok(f, name);
    for (const k of ['act', 'mode', 'set', 'priority', 'needs', 'after', 'example']) assert.equal(one(f, k), one(w, k), `${name}: ${k}`);
    assert.deepEqual(v(f, 'role'), v(w, 'role'), `${name}: roles`);
    assert.equal(patternOf(partsOf(name)), one(w, 'pattern').trim().split(/\s+/).join(' '), `${name}: pattern`);
    for (const k of Object.keys(w.attrs).filter((x) => x.startsWith('lit.'))) assert.equal(one(of('fixed').find((x) => one(x, 'frame') === name && one(x, 'role') === k.slice(4)), 'value'), one(w, k), `${name}: ${k}`);
  }
  assert.equal(local.length, 118);
  assert.deepEqual(of('joiner.keep').map((j) => one(j, 'text')), parse(localPart(src, 'joiners')).map((j) => one(j, 'text')));
});

test('w.lang.en: the parts of every frame give a pattern that reads back to the same parts', () => {
  const byFrame = new Map();
  for (const p of of('part')) (byFrame.get(one(p, 'frame')) ?? byFrame.set(one(p, 'frame'), []).get(one(p, 'frame'))).push(p);
  for (const [name, ps] of byFrame) {
    ps.sort((a, b) => one(a, 'at') - one(b, 'at'));
    const again = patternParts(patternOf(ps));
    assert.deepEqual(again.map((p) => p.is), ps.map((p) => one(p, 'is')), name);
    assert.deepEqual(again.map((p) => p.listed ?? null), ps.map((p) => one(p, 'listed') ?? null), `${name}: listed`);
  }
});

test('w.lang.en joins k.values: the numerals and ordinals agree with k.values.number', () => {
  const nums = kw('k.values', 'k.values.number');
  const value = (text, kind) => nums.find((n) => one(n, 'text') === text && one(n, 'kind') === kind)?.attrs.value?.[0];
  for (const n of of('numeral')) assert.equal(value(one(n, 'text'), 'cardinal'), one(n, 'value'), one(n, 'text'));
  for (const n of of('ordinal').filter((x) => one(x, 'text') !== 'last')) assert.equal(value(one(n, 'text'), 'ordinal'), one(n, 'value'), one(n, 'text'));
  for (const d of of('det').filter((x) => one(x, 'kind') === 'numeral')) assert.equal(value(one(d, 'text'), 'cardinal'), one(d, 'value'), one(d, 'text'));
  // the quantifiers over a whole set are set words of k.values
  // the quantifiers over a whole set are set words of k.values, by name or by a word of one (every is a word of each)
  const values = worlds.find((w) => w.id === 'k.values');
  const setWords = new Set([...wiresOf(values).filter((w) => w.type === 'k.values.set_word').map((s) => one(s, 'name')),
    ...[...wiresOf(values), ...parse(values.schemaText)].filter((w) => w.type === 'core.word' && one(w, 'of') === 'k.values.set_word.name').flatMap((w) => v(w, 'text'))]);
  for (const w of of('word').filter((x) => one(x, 'cat') === 'QALL')) assert.ok(setWords.has(one(w, 'text')), one(w, 'text'));
});

test('w.lang.en joins k.words: the irregular plurals and the noun exceptions are words with a noun sense', () => {
  const vocab = JSON.parse(readFileSync(join(WORLDS_DIR, 'vocab.json'), 'utf8'));
  const noun = (w) => (vocab[w] ?? []).some((s) => s.startsWith('k.words/'));
  const missing = [...of('irregular').map((w) => one(w, 'singular')), ...of('noun.exception').filter((w) => one(w, 'kind') === 'is-plural').map((w) => one(w, 'stem'))].filter((w) => !noun(w));
  assert.ok(missing.length <= 12, `words not in k.words: ${missing.join(' ')}`);
});

test('w.lang.en: the morphology rules read plurals the way the hand-over says', () => {
  const set = { inflect: of('inflect'), irregular: of('irregular'), exceptions: of('noun.exception') };
  for (const [pl, sg] of Object.entries({ tables: 'table', boxes: 'box', cherries: 'cherry', wolves: 'wolf', cacti: 'cactus', kiwis: 'kiwi', octopuses: 'octopus', buses: 'bus', glass: 'glass', iris: 'iris',
    mice: 'mouse', feet: 'foot', children: 'child', people: 'person', women: 'woman', sheep: 'sheep', antennae: 'antenna', vertebrae: 'vertebra', potatoes: 'potato', cola: 'cola' })) assert.equal(inflect(set, pl, 'singular', 'lemma'), sg, pl);
  for (const [sg, pl] of Object.entries({ table: 'tables', box: 'boxes', cherry: 'cherries', day: 'days', cactus: 'cacti', child: 'children', mouse: 'mice', sheep: 'sheep', antenna: 'antennas', tomato: 'tomatoes' })) assert.equal(inflect(set, sg, 'plural'), pl, sg);
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

test('w.lang.en is what the library reads: what this repository added (statements, the tag question, have, if, from now on, left of)', () => {
  const C2 = { ...C };
  for (const [s, start, c] of [['the table is red', 'S', 's.copula'], ['the cat is on the mat', 'S', 's.copula'], ['the table is red, isn\'t it', 'Q', 'q.tag'],
    ['the table that has four seats', 'NP', 'np.relative-have'], ['if the table is red then the chair is blue', 'S', 'clause.if'], ['from now on the squares are grey', 'S', 'clause.standing'],
    ['the star to the left of the house', 'NP', 'np.pp'], ['the mice', 'NP', 'np.det-n']]) {
    const p = read(s, start);
    assert.ok(p.some((x) => x.tree.rule.replace(/\.\d+$/, '').endsWith(`.${c}`)), `${s}: ${p.map((x) => x.tree.rule)} ${JSON.stringify(p.unknown ?? [])}`);
  }
  assert.equal(nounPhrase(read('the mice')[0].tree, C2).lemma, 'mouse');
  assert.deepEqual(nounPhrase(read('the star to the left of the house')[0].tree, C2).pp[0].words[0], 'to the left of');
});

test('w.lang.en is what the library reads: the views of a closed class and where they differ', () => {
  assert.deepEqual(grammarView(gw, 'w.lang.en.prep.time'), ['after', 'before', 'during', 'earlier than', 'later than', 'since', 'until']);
  const d = viewDiff(gw, 'w.lang.en.det', 'acts', 'discourse');
  assert.ok(d.only.acts.includes('another') && d.only.discourse.includes('his'), JSON.stringify(d));
});

test('block 06:55 item 1: the schema loads with every shard (many on rhs and in); priority decides the three ties of the examples', () => {
  const w = new World();
  assert.ok(w.tell(lang.schemaText).ok, 'schema');
  for (const s of lang.shards) { const r = w.tell(s.text); assert.ok(r.ok, `${s.id}: ${JSON.stringify(r.violations?.slice(0, 2))}`); }
  for (const t of ['rule', 'det', 'prep']) assert.equal(w.schema(`w.lang.en.${t}`).keys[t === 'rule' ? 'rhs' : 'in'].many, true, t);
  const pri = new Map(of('rule').filter((r) => one(r, 'priority')).map((r) => [r.id, Number(one(r, 'priority'))]));
  assert.equal(pri.size, 6); // and np.attribute-of, np.position-of (the holes), over np.possessive-of
  const name = (p) => p.tree.rule.replace(/^w\.lang\.en\.rule\./, '').replace(/\.\d+$/, '');
  // what a reader that honours priority before size picks (sopworld 0.52 ranks by size alone)
  const best = (ps) => [...ps].sort((a, b) => (pri.get(b.tree.rule) ?? 0) - (pri.get(a.tree.rule) ?? 0) || a.size - b.size)[0];
  for (const [s, start, c] of [['the legs of the crocodile', 'NP', 'np.possessive-of'], ['and two big ones', 'S', 'ellipsis.one-count'], ['and one yellow', 'S', 'ellipsis.one-bare']]) {
    const ps = read(s, start);
    assert.ok(ps.length, s);
    assert.equal(name(best(ps)), c, `${s}: ${ps.map(name)}`);
  }
});

test('the two holes of Round 12: imperative clauses and "of" beyond parts parse (verbs from k.actions, positions from k.values)', () => {
  const name = (p) => p.tree.rule.replace(/^w\.lang\.en\.rule\./, '').replace(/\.\d+$/, '');
  for (const [s, start, c] of [['draw a house', 'S', 'clause.imperative'], ['put the cat on the mat', 'S', 'clause.imperative'], ['please draw a red house', 'S', 'clause.imperative'],
    ['can you move the tree', 'S', 'clause.imperative'], ['do not move the tree', 'S', 'clause.imperative-neg'], ["don't draw a cat", 'S', 'clause.imperative-neg'],
    ['the colour of the table', 'NP', 'np.attribute-of'], ['the height of the tree', 'NP', 'np.attribute-of'], ['the top of the box', 'NP', 'np.position-of'], ['the bottom of the box', 'NP', 'np.position-of'],
    ['the legs of the crocodile', 'NP', 'np.possessive-of']]) {
    const ps = read(s, start);
    assert.ok(ps.length, `parses: ${s}`);
    assert.equal(name(ps[0]), c, `${s}: ${ps.map(name)}`);
  }
  for (const c of ['clause.imperative', 'clause.imperative-neg', 'np.attribute-of', 'np.position-of']) assert.equal(of('construction').find((x) => one(x, 'name') === c).attrs.status, undefined, c);
});
