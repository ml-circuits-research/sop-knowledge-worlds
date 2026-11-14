// w.lang.en in std.morph notation (reviewer block "02:55"): English regular inflection as paradigm classes and cells,
// irregular forms in std.morph's shape, and a dictionary of the catalog's nouns, verbs and adjectives; read by the
// library's morphOf / generate / analyse (the pinned build), and the suffix rules by its inflectBy.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fullWorld } from '../tools/lib/worlds.mjs';
import { morphOf, generate, analyse, dictionary, inflectBy } from '../tools/sopworld/sopworld.mjs';
import { TYPES, DIR, RAW, CLASSES, build, files } from '../tools/lang-en-morph.mjs';

const world = fullWorld('w.lang.en');
const m = morphOf(world, { types: TYPES });
const file = (p) => (existsSync(join(DIR, 'dictionary', `${p}.tsv`)) ? readFileSync(join(DIR, 'dictionary', `${p}.tsv`), 'utf8') : null);
const dict = dictionary({ read: file });
const names = readdirSync(join(DIR, 'dictionary')).filter((f) => f.endsWith('.tsv')).sort();
const rows = names.flatMap((n) => readFileSync(join(DIR, 'dictionary', n), 'utf8').split('\n').filter((l) => l && !l.startsWith('#')).map((l) => l.split('\t')));
const same = (a, b) => Object.keys(a).length === Object.keys(b).length && Object.entries(a).every(([k, v]) => b[k] === v);
const unq = (v) => String(v).replace(/^"|"$/g, '');
const POS = Object.fromEntries(CLASSES.map((c) => [c[0], c[4]]));

test('the shards and the dictionary are what tools/lang-en-morph.mjs gives (skipped without WordNet\'s raw files)', { skip: !existsSync(join(RAW, 'verb.exc')) && 'raw files not downloaded' }, () => {
  const f = files(build());
  for (const [name, text] of Object.entries(f.shards)) assert.equal(readFileSync(join(DIR, 'shards', name), 'utf8'), text, name);
  assert.deepEqual(names, Object.keys(f.dictionary).sort());
  for (const [name, text] of Object.entries(f.dictionary)) assert.equal(readFileSync(join(DIR, 'dictionary', name), 'utf8'), text, name);
});

test('the dictionary: sorted rows lemma<TAB>class with a header, classes of the world, one row per lemma and part of speech', () => {
  assert.ok(rows.length >= 13000, `${rows.length} rows`);
  for (const n of names) {
    const text = readFileSync(join(DIR, 'dictionary', n), 'utf8');
    for (const k of ['# sources:', '# license: WordNet-3.0', '# script: tools/lang-en-morph.mjs']) assert.ok(text.includes(k), `${n} ${k}`);
    const lines = text.split('\n').filter((l) => l && !l.startsWith('#'));
    assert.deepEqual(lines, [...lines].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)), `${n} sorted`);
    assert.ok(lines.every((l) => l[0] === n[0]), `${n}: one first letter`);
  }
  const seen = new Set();
  for (const [lemma, cls, ...rest] of rows) {
    assert.equal(rest.length, 0, lemma);
    assert.ok(m.classes.has(cls) && POS[cls], `${lemma} ${cls}`);
    assert.ok(file(lemma[0]).includes(`\n${lemma}\t${cls}\n`), lemma);
    const k = `${lemma}|${POS[cls]}`;
    assert.ok(!seen.has(k), `two classes for ${k}`);
    seen.add(k);
  }
  for (const pos of ['noun', 'verb', 'adjective']) assert.ok(rows.filter(([, c]) => POS[c] === pos).length > 800, pos);
});

// The round trip of the reviewer's block: every cell of every lemma's class generated, then analysed back to the
// lemma and the cell (an irregular form included: made is read as make, past).
test('round trip: every cell of every dictionary lemma is generated and analysed back to its lemma and cell', () => {
  let cells = 0;
  const bad = [];
  for (const [lemma, cls] of rows) for (const cell of m.classes.get(cls).cells.values()) {
    cells++;
    const g = generate(m, lemma, cls, cell.feat);
    if (g === null) { bad.push(`${lemma} ${cls} ${JSON.stringify(cell.feat)}: no form`); continue; }
    if (!analyse(m, g, { dictionary: dict }).some((r) => r.lemma === lemma && same(r.features, cell.feat))) bad.push(`${lemma} ${cls} ${JSON.stringify(cell.feat)} -> ${g}`);
  }
  console.log(`round trip: ${cells - bad.length} of ${cells} cells of ${rows.length} lemmas`);
  assert.ok(cells > 30000);
  assert.deepEqual(bad.slice(0, 20), []);
});

test('the reviewer\'s forms: inflectBy and std.morph give cats, boxes, berries, stopped, making, bigger', () => {
  assert.deepEqual([['cat', 'plural'], ['box', 'plural'], ['berry', 'plural'], ['stop', 'past'], ['make', 'ing'], ['big', 'comparative']].map(([w, op]) => inflectBy(world, w, op)),
    ['cats', 'boxes', 'berries', 'stopped', 'making', 'bigger']);
  const gen = (lemma, feat) => { const r = rows.find(([l, c]) => l === lemma && Object.keys(feat).every((k) => [...m.classes.get(c).cells.values()].some((x) => k in x.feat))); return generate(m, lemma, r[1], feat); };
  assert.deepEqual([gen('cat', { num: 'pl' }), gen('box', { num: 'pl' }), gen('berry', { num: 'pl' }), gen('stop', { vform: 'past' }), gen('make', { vform: 'ing' }), gen('big', { degree: 'comparative' })],
    ['cats', 'boxes', 'berries', 'stopped', 'making', 'bigger']);
  // more of each class, and the irregulars stay irregular
  assert.deepEqual([gen('leaf', { num: 'pl' }), gen('knife', { num: 'pl' }), gen('roof', { num: 'pl' }), gen('mouse', { num: 'pl' }), gen('child', { num: 'pl' }), gen('sheep', { num: 'pl' })], ['leaves', 'knives', 'roofs', 'mice', 'children', 'sheep']);
  assert.deepEqual([gen('carry', { vform: 'third' }), gen('carry', { vform: 'past' }), gen('die', { vform: 'ing' }), gen('agree', { vform: 'ing' }), gen('panic', { vform: 'past' }), gen('visit', { vform: 'past' }), gen('push', { vform: 'third' })],
    ['carries', 'carried', 'dying', 'agreeing', 'panicked', 'visited', 'pushes']);
  assert.deepEqual([gen('go', { vform: 'past' }), gen('go', { vform: 'past_participle' }), gen('make', { vform: 'past' }), gen('understand', { vform: 'past' }), gen('be', { vform: 'third' }), gen('have', { vform: 'third' })], ['went', 'gone', 'made', 'understood', 'is', 'has']);
  assert.deepEqual([gen('happy', { degree: 'superlative' }), gen('large', { degree: 'comparative' }), gen('good', { degree: 'comparative' }), gen('bad', { degree: 'superlative' })], ['happiest', 'larger', 'better', 'worst']);
  assert.equal(rows.find(([l, c]) => l === 'beautiful' && POS[c] === 'adjective')[1], 'adj.more');
  // a variant is read, never written: burnt is burn's past; burn's past is burned
  assert.equal(gen('burn', { vform: 'past' }), 'burned');
  assert.ok(analyse(m, 'burnt', { dictionary: dict }).some((r) => r.lemma === 'burn' && r.features.vform === 'past' && r.features.variant === 'yes'));
  assert.ok(analyse(m, 'antennae', { dictionary: dict }).some((r) => r.lemma === 'antenna' && r.features.num === 'pl'));
  assert.equal(gen('antenna', { num: 'pl' }), 'antennas');
});

// inflectBy's suffix rules are the guess for a word no dictionary has: measured against the dictionary's forms on
// the regular cells (the irregular ones aside). Plural-form nouns (arms) and stress (visit, visited; British -ll-)
// are where spelling rules cannot know.
test('agreement of the suffix rules (inflectBy) with the dictionary on regular cells', () => {
  const OP = { num: { pl: 'plural' }, vform: { third: 'third', past: 'past', ing: 'ing' }, degree: { comparative: 'comparative', superlative: 'superlative' } };
  const irr = new Set(world.ofType(TYPES.irregular).filter((x) => !x.attrs.variant).map((x) => `${unq(x.attrs.lemma[0])}|${['num', 'vform', 'degree'].map((k) => x.attrs[k]?.[0]).find(Boolean)}`));
  const agree = {};
  for (const [lemma, cls] of rows) for (const cell of m.classes.get(cls).cells.values()) {
    const [k, v] = Object.entries(cell.feat)[0];
    const op = OP[k]?.[v];
    if (!op || irr.has(`${lemma}|${v}`)) continue;
    const a = (agree[op] ||= { same: 0, of: 0 });
    a.of++;
    if (inflectBy(world, lemma, op, op === 'plural' ? {} : { types: { irregular: 'w.lang.en.no_irregular' } }) === generate(m, lemma, cls, cell.feat)) a.same++;
  }
  console.log(`inflectBy agrees: ${Object.entries(agree).map(([op, a]) => `${op} ${a.same}/${a.of} (${((100 * a.same) / a.of).toFixed(1)} %)`).join(', ')}`);
  const share = (op) => agree[op].same / agree[op].of;
  assert.ok(share('plural') >= 0.96 && share('third') >= 0.99 && share('past') >= 0.94 && share('ing') >= 0.94 && share('comparative') >= 0.98 && share('superlative') >= 0.98, JSON.stringify(agree));
});

test('irregular forms: one wire per lemma, form and cell; derived plurals name their w.lang.en.irregular fact, and every one is there', () => {
  const forms = world.ofType(TYPES.irregular);
  const keys = forms.map((x) => `${unq(x.attrs.lemma[0])}|${unq(x.attrs.form[0])}|${['num', 'vform', 'degree'].map((k) => x.attrs[k]?.[0]).find(Boolean)}`);
  assert.equal(new Set(keys).size, keys.length);
  const plurals = world.ofType('w.lang.en.irregular');
  const ids = new Set(plurals.map((x) => x.id));
  for (const x of forms.filter((f) => f.attrs.from)) assert.ok(ids.has(unq(x.attrs.from[0])), x.id);
  for (const p of plurals) assert.ok(forms.some((x) => x.attrs.from && unq(x.attrs.from[0]) === p.id), p.id);
  // a written irregular is never also a variant of the same cell
  for (const x of forms.filter((f) => !f.attrs.variant)) assert.ok(!forms.some((y) => y !== x && y.attrs.variant && unq(y.attrs.form[0]) === unq(x.attrs.form[0]) && unq(y.attrs.lemma[0]) === unq(x.attrs.lemma[0])), x.id);
});
