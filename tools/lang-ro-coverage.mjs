// w.lang.ro: how many words of a Romanian corpus the morphology reads (some lemma among the readings: a closed-class
// word or a form a dictionary lemma's class generates), with the hand dictionary alone and with the dictionary
// derived from UniMorph added (reviewer block "18:20" item 3). No gold lemmas: a reading is counted, not checked.
//   node tools/lang-ro-coverage.mjs <psys2>/training/eval/ro-en-meaning/rows.jsonl
// The corpus is read in place (PSys2's evaluation set, not copied here).
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR, fullWorld } from './lib/worlds.mjs';
import { morphOf, analyse, fold, dictionary, splitClitics } from './sopworld/sopworld.mjs';
import { TYPES } from './lang-ro-core.mjs';

const DIR = join(WORLDS_DIR, 'w.lang.ro');
const tok = (t) => (typeof t === 'string' && t.startsWith('"') ? JSON.parse(t) : t);

export function setup() {
  const world = fullWorld('w.lang.ro');
  const m = morphOf(world, { types: TYPES });
  const closed = new Set();
  for (const t of ['det', 'pron', 'prep', 'numeral', 'particle']) for (const w of world.ofType(`w.lang.ro.${t}`)) closed.add(fold(m, tok(w.attrs.form[0])));
  const read = (folder) => (p) => { const f = join(DIR, folder, `${p}.tsv`); return existsSync(f) ? readFileSync(f, 'utf8') : null; };
  const hand = dictionary({ read: read('dictionary'), fold: (s) => fold(m, s) });
  const both = dictionary({ read: (p) => [read('dictionary')(p), read('dictionary-unimorph')(p)].filter(Boolean).join('\n') || null, fold: (s) => fold(m, s) });
  const known = (d, word) => closed.has(fold(m, word)) || analyse(m, word, { dictionary: d }).length > 0;
  const words = (s) => [...s.matchAll(/\p{L}+(?:-\p{L}+)*/gu)].flatMap(([t]) => splitClitics(m, t).map((p) => p.toLowerCase())).filter((w) => w.length > 1);
  return { m, hand, both, known, words };
}

export function measure(rows, s = setup()) {
  const groups = {};
  const cache = new Map();
  for (const r of rows) {
    const g = (groups[['authored', 'hand', 'owner'].includes(r.ro_by) ? 'hand Romanian' : 'machine Romanian'] ??= { rows: 0, words: 0, hand: 0, both: 0 });
    g.rows++;
    for (const w of s.words(r.ro)) {
      if (!cache.has(w)) cache.set(w, [s.known(s.hand, w), s.known(s.both, w)]);
      const [a, b] = cache.get(w);
      g.words++; g.hand += a ? 1 : 0; g.both += b ? 1 : 0;
    }
  }
  return groups;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const rows = readFileSync(process.argv[2], 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  const t0 = Date.now();
  const groups = measure(rows);
  for (const [k, g] of Object.entries(groups)) console.log(`${k}: ${g.rows} rows, ${g.words} words; read with the hand dictionary ${(100 * g.hand / g.words).toFixed(1)}%, with UniMorph added ${(100 * g.both / g.words).toFixed(1)}%`);
  console.log(`${((Date.now() - t0) / 1000).toFixed(1)} s`);
}
