// w.lang.ro (block "09:25", first draft): Romanian as a language world in the library's std.morph notation, read
// with the one pinned build. The shards and the dictionary are what tools/lang-ro-core.mjs writes; they load with no
// warning; the dictionary has the documented format and its senses exist in k.words and k.actions; the closed
// classes join w.lang.en and k.layouts by relation name; the round trip analyse(generate(x)) holds for every class
// and cell, in exact spelling and typed without diacritics (Q51, Q52 answered by sopworld 0.63); and the words of PSys2's Romanian commands are analysed (coverage).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR, REPO, scanWorlds, fullWorld } from '../tools/lib/worlds.mjs';
import { parse, morphOf, generate, analyse, fold, splitClitics, dictionary, realise, templateFor } from '../tools/sopworld/sopworld.mjs';
import { langRoShards, dictionaryFiles, dictionaryRows, TYPES, CLASSES, LEXICON, foldText } from '../tools/lang-ro-core.mjs';

const DIR = join(WORLDS_DIR, 'w.lang.ro');
const worlds = scanWorlds();
const lang = worlds.find((w) => w.id === 'w.lang.ro');
const world = fullWorld('w.lang.ro', worlds);
const tok = (t) => (typeof t === 'string' && t.startsWith('"') ? JSON.parse(t) : t);
const wires = lang.shards.flatMap((s) => parse(s.text));
const of = (type) => wires.filter((w) => w.type === `w.lang.ro.${type}`);
const one = (w, k) => tok(w.attrs[k]?.[0]);
const file = (p) => (existsSync(join(DIR, 'dictionary', `${p}.tsv`)) ? readFileSync(join(DIR, 'dictionary', `${p}.tsv`), 'utf8') : null);
// Two readings of the same rules: with the folds (a word typed without diacritics) and in exact spelling (no folds).
const m = morphOf(world, { types: TYPES });
const exact = morphOf(world, { types: { ...TYPES, fold: 'w.lang.ro.none' } });
const dict = dictionary({ read: file, fold: (s) => fold(m, s) });
const dictExact = dictionary({ read: (p) => file(foldText(p)) });
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const backTo = (mm, d, lemma, cls, feat, form) => analyse(mm, form, { dictionary: d }).some((r) => r.lemma === lemma && r.class === cls && same(r.features, feat));

test('w.lang.ro: the shards and the dictionary are what tools/lang-ro-core.mjs gives; they load with no warning', () => {
  for (const [name, t] of Object.entries(langRoShards())) assert.equal(readFileSync(join(DIR, 'shards', name), 'utf8'), t, name);
  const files = dictionaryFiles();
  assert.deepEqual(readdirSync(join(DIR, 'dictionary')).filter((f) => f.endsWith('.tsv')).sort(), Object.keys(files).sort());
  for (const [name, t] of Object.entries(files)) assert.equal(readFileSync(join(DIR, 'dictionary', name), 'utf8'), t, name);
  assert.deepEqual(world.warnings ?? [], []);
  assert.equal(m.classes.size, CLASSES.length);
});

test('w.lang.ro: the dictionary is sorted, split by the first folded letter, with a header; classes, genders and senses exist', () => {
  const senses = new Set();
  for (const id of ['k.words', 'k.actions']) for (const s of worlds.find((w) => w.id === id).shards) for (const x of s.text.matchAll(/^@(\S+)/gm)) senses.add(x[1]);
  let rows = 0;
  const noSense = [];
  for (const name of readdirSync(join(DIR, 'dictionary'))) {
    const text = readFileSync(join(DIR, 'dictionary', name), 'utf8');
    assert.match(text, /^# .*\n# source: .*\n# license: CC0-1\.0\n/, `${name}: header with source and licence`);
    const lines = text.split('\n').filter((l) => l && !l.startsWith('#')).map((l) => l.split('\t'));
    const keys = lines.map(([lemma]) => `${foldText(lemma)}\t${lemma}`);
    assert.deepEqual(keys, [...keys].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)), `${name}: sorted by folded lemma`);
    for (const [lemma, cls, gender, sense, ...rest] of lines) {
      rows++;
      assert.equal(rest.length, 0);
      assert.equal(foldText(lemma)[0], name[0], `${lemma} in ${name}`);
      assert.ok(m.classes.has(cls), `${lemma}: class ${cls}`);
      const pos = CLASSES.find((c) => c[0] === cls)[4];
      if (pos === 'noun') assert.match(gender, /^[mfn]$/, `${lemma}: a noun has a gender`); else assert.equal(gender, '', `${lemma}: no gender`);
      if (sense) assert.ok(senses.has(sense), `${lemma}: sense ${sense} is no wire of k.words or k.actions`); else if (cls !== 'det.art') noSense.push(lemma); // the article is grammar, not a sense
    }
  }
  console.log(`dictionary: ${rows} lemmas, ${noSense.length} without a sense (k.words has none yet): ${noSense.join(' ')}`);
  assert.deepEqual(noSense, [], 'every lemma has an English sense (block 16:10 added the last 9 to k.words)');
  assert.equal(rows, dictionaryRows().length);
  assert.ok(rows >= 200, `${rows} lemmas`);
  // the commands of the app (imperative and present): each has a verb whose sense is that k.actions verb
  for (const v of ['make.draw', 'make.add', 'place.put', 'place.move', 'remove.remove', 'make.make', 'change.show', 'change.change', 'change.colour', 'remove.delete', 'load.open', 'change.close', 'undo.undo']) {
    assert.ok(dictionaryRows().some((r) => r[3] === `k.actions.verb.${v}`), v);
  }
});

test('w.lang.ro: forms the rules generate (nouns, adjectives, verbs, irregulars)', () => {
  const g = (lemma, cls, feat) => generate(m, lemma, cls, feat);
  const N = (num, kase, def) => ({ num, case: kase, def });
  assert.equal(g('casă', 'f.ă', N('pl', 'nomacc', 'yes')), 'casele');
  assert.equal(g('carte', 'f.e.alt', N('pl', 'nomacc', 'no')), 'cărți', 'a > ă at the last vowel and t > ț at the end (0.53)');
  assert.equal(g('floare', 'f.e.alt', N('pl', 'nomacc', 'no')), 'flori');
  assert.equal(g('barcă', 'f.ăi.a', N('sg', 'gendat', 'yes')), 'bărcii');
  assert.equal(g('titlu', 'n.u', N('pl', 'nomacc', 'yes')), 'titlurile', 'n.u inherits n.uri and overrides its singular');
  assert.equal(g('stea', 'f.ea', N('sg', 'nomacc', 'yes')), 'steaua');
  assert.equal(g('măr', 'n.e.ă', N('pl', 'nomacc', 'no')), 'mere');
  assert.equal(g('elefant', 'm.cons', N('pl', 'nomacc', 'no')), 'elefanți');
  assert.equal(g('roșu', 'a.u', { gender: 'f', num: 'sg', case: 'nomacc' }), 'roșie');
  assert.equal(g('albastru', 'a.ru', { gender: 'm', num: 'pl', case: 'nomacc' }), 'albaștri');
  assert.equal(g('frumos', 'a.1.oa', { gender: 'f', num: 'sg', case: 'nomacc' }), 'frumoasă');
  const imp = { tense: 'imper', person: '2', num: 'sg' }, p = (person, num) => ({ tense: 'pres', person, num });
  assert.deepEqual(['desena', 'muta', 'adăuga', 'arăta', 'șterge', 'deschide', 'pune', 'face', 'vorbi', 'colora', 'schimba', 'juca'].map((l) => g(l, LEXICON.find((r) => r[0] === l)[1], imp)),
    ['desenează', 'mută', 'adaugă', 'arată', 'șterge', 'deschide', 'pune', 'fă', 'vorbește', 'colorează', 'schimbă', 'joacă']);
  assert.deepEqual([g('pune', 'v.e.s.n', p('2', 'sg')), g('muta', 'v.a', p('2', 'sg')), g('deschide', 'v.e.s.d', p('2', 'sg')), g('juca', 'v.a.u', p('1', 'sg')), g('copia', 'v.a.iez', p('3', 'sg'))], ['pui', 'muți', 'deschizi', 'joc', 'copiază']);
  assert.deepEqual([g('deschide', 'v.e.s.d', { tense: 'part' }), g('șterge', 'v.e.s.g', { tense: 'part' }), g('scoate', 'v.e.s.t', { tense: 'part' }), g('face', 'v.e', { tense: 'part' })], ['deschis', 'șters', 'scos', 'făcut']);
  assert.deepEqual([g('fi', 'v.i.esc', p('3', 'sg')), g('avea', 'v.ea', p('3', 'sg')), g('zi', 'f.ă', N('sg', 'nomacc', 'yes'))], ['este', 'are', 'ziua'], 'irregulars first');
});

// The round trip over every lemma of the dictionary and every cell of its class (since sopworld 0.63, which answered
// Q52, with no exception).
test('w.lang.ro: round trip, exact spelling: analyse(generate(x)) gives x back for every lemma, class and cell', () => {
  let cells = 0, ok = 0;
  const bad = [];
  for (const [lemma, cls] of LEXICON) for (const cell of m.classes.get(cls).cells.values()) {
    const form = generate(exact, lemma, cls, cell.feat);
    cells++;
    if (backTo(exact, dictExact, lemma, cls, cell.feat, form)) ok++; else bad.push(`${lemma} ${cls} ${JSON.stringify(cell.feat)} ${form}`);
  }
  console.log(`round trip exact: ${ok} of ${cells} cells; not back: ${bad.join('; ')}`);
  assert.deepEqual(bad, []);
  // every class and cell once, with the first lemma of the class
  let classCells = 0, classOk = 0;
  for (const [name, c] of m.classes) {
    const lemma = LEXICON.find((r) => r[1] === name)?.[0];
    assert.ok(lemma, `a lemma for ${name}`);
    for (const cell of c.cells.values()) { classCells++; if (backTo(exact, dictExact, lemma, name, cell.feat, generate(exact, lemma, name, cell.feat))) classOk++; }
  }
  console.log(`round trip by class: ${classOk} of ${classCells} cells of ${m.classes.size} classes`);
  assert.equal(classOk, classCells);
});

test('w.lang.ro: round trip through the folds: a form typed without diacritics (questions.md Q51, answered by sopworld 0.63)', () => {
  let cells = 0, ok = 0;
  for (const [lemma, cls] of LEXICON) for (const cell of m.classes.get(cls).cells.values()) {
    cells++;
    if (backTo(m, dict, lemma, cls, cell.feat, foldText(generate(m, lemma, cls, cell.feat)))) ok++;
  }
  console.log(`round trip folded: ${ok} of ${cells} cells`);
  assert.equal(ok, cells);
});

test('w.lang.ro: closed classes join w.lang.en and k.layouts by relation; numerals by value; clitics split', () => {
  const enAll = worlds.find((w) => w.id === 'w.lang.en').shards.flatMap((s) => parse(s.text));
  const en = enAll.filter((w) => w.type === 'w.lang.en.prep');
  const rels = new Set(enAll.filter((w) => w.type === 'w.lang.en.prep' || w.type === 'w.lang.en.prep.time').map((w) => one(w, 'rel')));
  const layoutOf = new Map(en.filter((w) => w.attrs.layout).map((w) => [one(w, 'rel'), `${one(w, 'layout')} ${one(w, 'inverse') ?? ''}`]));
  for (const p of of('prep')) {
    assert.ok(rels.has(one(p, 'rel')), `${one(p, 'form')}: rel ${one(p, 'rel')} is a w.lang.en relation`);
    if (p.attrs.layout) assert.equal(`${one(p, 'layout')} ${one(p, 'inverse') ?? ''}`, layoutOf.get(one(p, 'rel')), `${one(p, 'form')}: the same k.layouts relation as w.lang.en`);
  }
  const values = new Set(worlds.find((w) => w.id === 'k.values').shards.flatMap((s) => parse(s.text)).filter((w) => w.type === 'k.values.number').map((w) => Number(tok(w.attrs.value?.[0]))));
  for (const n of of('numeral')) assert.ok(values.has(Number(one(n, 'value'))), `${one(n, 'form')}: ${one(n, 'value')} is a k.values number`);
  assert.deepEqual(splitClitics(m, 'desenează-mi'), ['desenează', 'mi']);
  for (const p of of('pron').filter((x) => one(x, 'clitic') === 'joined')) assert.ok(of('pron').some((q) => one(q, 'lemma') === one(p, 'lemma') && one(q, 'clitic') !== 'joined'), `${one(p, 'form')}: a joined clitic has a full form`);
});

test('w.lang.ro: replies realised from the templates, with agreement (std.morph realise)', () => {
  const base = { num: 'sg', case: 'nomacc' };
  assert.equal(realise(m, templateFor(m, 'make'), { art: 'un', kind: 'casă', colour: 'roșu' }, { dictionary: dict, base }), 'am desenat o casă roșie');
  assert.equal(realise(m, templateFor(m, 'make'), { art: 'un', kind: 'copac', colour: 'verde' }, { dictionary: dict, base }), 'am desenat un copac verde');
  assert.equal(realise(m, templateFor(m, 'make'), { art: 'un', kind: 'desen', colour: 'albastru' }, { dictionary: dict, base }), 'am desenat un desen albastru');
  assert.equal(realise(m, templateFor(m, 'remove'), { thing: 'stea' }, { dictionary: dict, base }), 'am șters steaua');
  assert.equal(realise(m, templateFor(m, 'change'), { thing: 'mașină', colour: 'galben' }, { dictionary: dict, base }), 'mașina este acum galbenă');
});

// Coverage: the share of the words of PSys2's Romanian commands (sources/psys2-eval-ro) whose lemma is among the
// readings: the closed classes by form, then std.morph with the dictionary. Gold lemmas written by hand.
const readings = (mm, d, word) => {
  const plain = fold(mm, word);
  const out = [];
  for (const t of ['det', 'pron', 'prep', 'numeral', 'particle']) for (const w of of(t)) if (fold(mm, one(w, 'form')) === plain) out.push(one(w, 'lemma') ?? one(w, 'form'));
  for (const r of analyse(mm, word, { dictionary: d })) out.push(r.lemma);
  return [...new Set(out)];
};
const words = (s) => [...s.matchAll(/\p{L}+(?:-\p{L}+)*/gu)].flatMap(([t]) => splitClitics(m, t).map((p) => ({ word: p.toLowerCase(), letter: p.length === 1 && p !== p.toLowerCase() })));
test('w.lang.ro: coverage on the Romanian commands of PSys2 (art.draw, docs.editor, ui.shell, data.charts)', () => {
  const src = join(REPO, 'sources', 'psys2-eval-ro');
  const messages = readFileSync(join(src, 'messages.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  const gold = new Map(readFileSync(join(src, 'gold-lemmas.tsv'), 'utf8').split('\n').filter((l) => l && !l.startsWith('#')).map((l) => { const [f, ls, kind] = l.split('\t'); return [f, { lemmas: ls ? ls.split(' ') : [], kind }]; }));
  const count = (pairs, mm, d) => {
    let n = 0, found = 0, first = 0, skipped = 0;
    const missed = new Map();
    for (const { word, g } of pairs) {
      if (!g || g.kind !== 'word') { skipped++; continue; }
      n++;
      const r = readings(mm, d, word);
      if (r.some((x) => g.lemmas.includes(x))) found++; else missed.set(word, (missed.get(word) ?? 0) + 1);
      if (g.lemmas.includes(r[0])) first++;
    }
    return { n, found, first, skipped, missed };
  };
  const plain = [], casual = [];
  let unaligned = 0;
  for (const msg of messages) {
    const ws = words(msg.message).map((w) => ({ ...w, g: w.letter ? null : gold.get(w.word) }));
    plain.push(...ws);
    // a casual variant's word takes the gold of the word of the same message it folds to
    if (msg.casual) for (const w of words(msg.casual)) { const at = ws.find((x) => foldText(x.word) === w.word); if (at) casual.push({ word: w.word, g: at.g }); else unaligned++; }
  }
  const a = count(plain, exact, dictExact), b = count(casual, m, dict), c = count(plain, m, dict);
  const pct = (x, y) => `${((100 * x) / y).toFixed(1)}%`;
  console.log(`coverage, with diacritics, exact spelling: ${a.found}/${a.n} words ${pct(a.found, a.n)} (first reading ${pct(a.first, a.n)}); not counted: ${a.skipped} names, letters and foreign words`);
  console.log(`coverage, with diacritics, through the folds: ${c.found}/${c.n} ${pct(c.found, c.n)}; casual (no diacritics): ${b.found}/${b.n} ${pct(b.found, b.n)} (${unaligned} casual words not aligned)`);
  console.log(`missed (exact): ${[...a.missed].sort((x, y) => y[1] - x[1]).map(([w, k]) => `${w}:${k}`).join(' ')}`);
  assert.ok(a.found / a.n >= 0.9, 'nine words in ten analysed in exact spelling');
});

test('w.lang.ro: Romanian stays in its world: no other world names it, and its words are not in the English vocabulary', () => {
  // (k.units.measure names the numeric slots of every world, this one's too: slot names, not words)
  for (const w of worlds.filter((x) => x.id !== 'w.lang.ro')) for (const s of [{ id: 'schema', text: w.schemaText }, ...w.shards].filter((x) => x.id !== 'k.units/shards/measures')) assert.doesNotMatch(s.text, /w\.lang\.ro/, `${w.id} ${s.id}`);
  const vocab = JSON.parse(readFileSync(join(WORLDS_DIR, 'vocab.json'), 'utf8'));
  const bad = Object.entries(vocab).filter(([, ids]) => ids.some((id) => id.startsWith('w.lang.ro/shards'))).map(([k]) => k);
  assert.deepEqual(bad, []);
});


// The dictionary derived from UniMorph (blocks "18:20" item 2, "19:35"): lemma -> class only, in a folder of its own
// under UniMorph's licence; the files are what tools/lang-ro-unimorph.mjs gives from the raw file (when it is here).
test('w.lang.ro: the dictionary derived from UniMorph: its own folder and licence, classes that exist, no lemma of the hand dictionary', async () => {
  const { run } = await import('../tools/lang-ro-unimorph.mjs');
  const dir = join(DIR, 'dictionary-unimorph');
  const names = readdirSync(dir).filter((f) => f.endsWith('.tsv')).sort();
  const handLemmas = new Set(LEXICON.map((r) => r[0]));
  let rows = 0;
  for (const f of names) {
    const text = readFileSync(join(dir, f), 'utf8');
    assert.match(text, /^# license: CC-BY-SA-3\.0$/m, f);
    for (const line of text.split('\n').filter((l) => l && !l.startsWith('#'))) {
      const [lemma, cls, gender, sense] = line.split('\t');
      rows++;
      assert.ok(m.classes.has(cls), `${lemma}: ${cls}`);
      assert.ok(!handLemmas.has(lemma), `${lemma} is in the hand dictionary`);
      assert.equal(sense, '', 'no sense is guessed');
      assert.equal(gender, cls.match(/^([mfn])\./)?.[1] ?? '', lemma);
    }
  }
  assert.ok(rows >= 3000, `${rows} derived lemmas`);
  const raw = join(REPO, 'sources/unimorph-ron/raw/ron.tsv');
  if (existsSync(raw)) {
    const { files, stats } = run(raw);
    assert.deepEqual(names, Object.keys(files).sort());
    for (const [name, t] of Object.entries(files)) assert.equal(readFileSync(join(dir, name), 'utf8'), t, name);
    console.log(`UniMorph: ${stats.lemmas} lemmas; a class fits ${stats.fit + stats.tie} (${stats.tie} with another class generating as well), none ${stats.none}, too few forms ${stats.few}; of the ${stats.hand} hand lemmas, the hand class fits for ${stats.handAgrees}`);
    assert.ok((stats.fit + stats.tie) / stats.lemmas >= 0.75);
    assert.ok(stats.handAgrees / stats.hand >= 0.9, 'the derivation agrees with the hand classes');
  }
  // With the derived dictionary added, a word of the hand dictionary reads as before, and new lemmas read.
  const read = (folder) => (p) => { const f = join(DIR, folder, `${p}.tsv`); return existsSync(f) ? readFileSync(f, 'utf8') : null; };
  const both = dictionary({ read: (p) => [read('dictionary')(p), read('dictionary-unimorph')(p)].filter(Boolean).join('\n') || null, fold: (s) => fold(m, s) });
  assert.ok(analyse(m, 'desenează', { dictionary: both }).some((r) => r.lemma === 'desena'));
  const sample = readFileSync(join(dir, 'c.tsv'), 'utf8').split('\n').filter((l) => l && !l.startsWith('#')).slice(0, 20).map((l) => l.split('\t'));
  for (const [lemma, cls] of sample) assert.ok(analyse(m, lemma, { dictionary: both }).some((r) => r.lemma === lemma && r.class === cls), `${lemma} ${cls}`);
});
