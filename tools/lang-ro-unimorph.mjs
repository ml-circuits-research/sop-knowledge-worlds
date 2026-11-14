// w.lang.ro, a bigger dictionary derived, not typed (reviewer blocks "18:20" item 2 and "19:35"): each lemma of
// UniMorph Romanian (CC BY-SA 3.0) is put into the paradigm class of w.lang.ro whose generated forms contain every
// form UniMorph gives for it. Only lemma, class and gender are kept (no form); the sense is left empty. The rows go
// to `dictionary-unimorph/<letter>.tsv`, a folder of their own with UniMorph's licence; the hand dictionary wins
// where it has the lemma.
//   node tools/lang-ro-unimorph.mjs [--in sources/unimorph-ron/raw/ron.tsv]
// Comparing by sets of forms, not by UniMorph's feature labels: the Romanian file labels some noun cells wrongly
// (casa as NOM/ACC PL DEF, "niște case" as SG), so a cell-by-cell match would reject correct classes.
// What is compared: nouns, every form but the vocative, with the article words stripped (o, un, unei, unui, unor,
// niște); adjectives, the indefinite forms; verbs, the present, the conjunctive (să stripped), the positive
// imperative, the infinitive (a stripped) and the participle. The past tenses, the gerund and the negative imperative
// are not cells of w.lang.ro and are left out, and so is anything still of two words after the strip (the file holds
// labels such as "definite articulation" in place of some adjective forms).
import { readFileSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR, REPO, fullWorld } from './lib/worlds.mjs';
import { morphOf, generate, fold } from './sopworld/sopworld.mjs';
import { TYPES, CLASSES, dictionaryRows } from './lang-ro-core.mjs';

export const SOURCE = 'unimorph-ron 2026-11-14';
const POS = { N: 'noun', ADJ: 'adjective', V: 'verb', 'V.PTCP': 'verb', 'V.CVB': 'verb' };
const STRIP = /^(o|un|unei|unui|unor|niște|să|a) /;
const genderOf = (cls) => (cls.startsWith('m.') ? 'm' : cls.startsWith('f.') ? 'f' : cls.startsWith('n.') ? 'n' : '');

// The comparable forms of each lemma and part of speech: Map("lemma\tpos" -> Set(form)).
export function readUnimorph(text) {
  const out = new Map();
  for (const line of text.split('\n')) {
    const [lemma, form, feats] = line.split('\t');
    if (!lemma || !form || !feats) continue;
    const f = feats.split(';');
    const pos = POS[f[0]];
    if (!pos || lemma.includes(' ')) continue;
    if (f.includes('VOC') || f.includes('NEG') || f.includes('PST') && f[0] !== 'V.PTCP' || f[0] === 'V.CVB') continue;
    if (pos === 'adjective' && f.includes('DEF')) continue;
    if (form.startsWith('nu ')) continue;
    const key = `${lemma}\t${pos}`;
    if (!out.has(key)) out.set(key, new Set());
    const bare = form.replace(STRIP, '');
    if (bare.includes(' ')) continue; // a label left in the data ("definite articulation") or a phrase, not a form
    out.get(key).add(bare);
  }
  return out;
}

// The class of one lemma: those whose generated forms contain all of UniMorph's (at least 3 of them); among several,
// the one whose own forms UniMorph confirms most (fewest generated forms UniMorph lacks), then the first in CLASSES.
export function classify(m, lemma, pos, forms) {
  if (forms.size < 3) return { status: 'few' };
  const fits = [];
  for (const [name, , , , cpos] of CLASSES) {
    if (cpos !== pos || name === 'det.art') continue;
    const cls = m.classes.get(name);
    const gen = new Set();
    for (const cell of cls.cells.values()) { const g = generate(m, lemma, name, cell.feat); if (g) gen.add(g); }
    if ([...forms].every((x) => gen.has(x))) fits.push({ name, extra: [...gen].filter((g) => !forms.has(g)).length });
  }
  if (!fits.length) return { status: 'none' };
  fits.sort((a, b) => a.extra - b.extra);
  return { status: fits.length > 1 && fits[1].extra === fits[0].extra ? 'tie' : 'fit', cls: fits[0].name, fits: fits.map((x) => x.name) };
}

export function deriveDictionary(text, m) {
  const hand = new Map(dictionaryRows().map(([lemma, cls]) => [lemma, cls]));
  const stats = { lemmas: 0, few: 0, none: 0, fit: 0, tie: 0, hand: 0, handAgrees: 0, byPos: {} };
  const rows = [];
  for (const [key, forms] of [...readUnimorph(text)].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
    const [lemma, pos] = key.split('\t');
    stats.lemmas++;
    const r = classify(m, lemma, pos, forms);
    stats[r.status]++;
    const p = (stats.byPos[pos] ??= { lemmas: 0, fit: 0, tie: 0 });
    p.lemmas++;
    if (r.status === 'fit' || r.status === 'tie') p[r.status]++;
    if (hand.has(lemma)) { stats.hand++; if (r.fits?.includes(hand.get(lemma))) stats.handAgrees++; continue; }
    if (r.status === 'fit' || r.status === 'tie') rows.push([lemma, r.cls, genderOf(r.cls), '']);
  }
  return { rows, stats };
}

// One file per first folded letter, sorted by folded lemma, as the hand dictionary.
export function unimorphFiles(rows, m) {
  const files = {};
  const folded = (s) => fold(m, s);
  const sorted = [...rows].sort((a, b) => { const x = folded(a[0]), y = folded(b[0]); return x < y ? -1 : x > y ? 1 : a[0] < b[0] ? -1 : 1; });
  for (const r of sorted) {
    const p = folded(r[0])[0];
    files[`${p}.tsv`] ??= [`# w.lang.ro dictionary derived from UniMorph, lemmas whose folded spelling starts with "${p}": lemma<TAB>class<TAB>gender<TAB>sense`,
      '# source: unimorph-ron 2026-11-14 (UniMorph Romanian, https://github.com/unimorph/ron, from Wiktionary; each lemma put into the w.lang.ro class whose forms contain all of its UniMorph forms; no form is kept)',
      '# license: CC-BY-SA-3.0', '# script: tools/lang-ro-unimorph.mjs'];
    files[`${p}.tsv`].push(r.join('\t'));
  }
  return Object.fromEntries(Object.entries(files).map(([k, v]) => [k, `${v.join('\n')}\n`]));
}

export function run(input = join(REPO, 'sources/unimorph-ron/raw/ron.tsv')) {
  const world = fullWorld('w.lang.ro');
  const m = morphOf(world, { types: { ...TYPES, fold: 'w.lang.ro.none' } });
  const folding = morphOf(world, { types: TYPES });
  const { rows, stats } = deriveDictionary(readFileSync(input, 'utf8'), m);
  return { files: unimorphFiles(rows, folding), rows, stats };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const i = process.argv.indexOf('--in');
  const { files, rows, stats } = run(i < 0 ? undefined : process.argv[i + 1]);
  const dir = join(WORLDS_DIR, 'w.lang.ro', 'dictionary-unimorph');
  mkdirSync(dir, { recursive: true });
  for (const f of readdirSync(dir)) if (f.endsWith('.tsv')) rmSync(join(dir, f));
  for (const [name, text] of Object.entries(files)) writeFileSync(join(dir, name), text);
  console.log(JSON.stringify({ ...stats, rows: rows.length, files: Object.keys(files).length }));
}
