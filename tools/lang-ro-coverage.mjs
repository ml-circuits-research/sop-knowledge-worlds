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

// ---- frames (block "18:20" item 1): the share of sentences whose act and roles w.lang.ro's frames read ----
// A row counts when its reference reading (PSys2's rules reader of the English side) is one request of a frame act
// (the last part of its action: make, change, place, ...). read: a frame of w.lang.ro reads the whole Romanian
// sentence; act: the same act and mode; act+roles: and the same roles, both sides taken to the roles of k.actions by
// w.lang.en's role maps (for the reference, the maps of the English frame the Romanian frame names, then the act's).
export function measureFrames(rows, reader, enWires) {
  const tokv = (t) => (typeof t === 'string' && t.startsWith('"') ? JSON.parse(t) : t);
  const oneOf = (w, k) => tokv(w.attrs[k]?.[0]);
  const maps = enWires.filter((w) => w.type === 'w.lang.en.role_map');
  const modes = new Map(enWires.filter((w) => w.type === 'w.lang.en.mode_map').map((x) => [`${oneOf(x, 'act')} ${oneOf(x, 'mode')}`, oneOf(x, 'means')]));
  const enFrames = new Map(enWires.filter((w) => w.type === 'w.lang.en.frame').map((x) => [oneOf(x, 'name'), x]));
  const actNames = new Set(enWires.filter((w) => w.type === 'w.lang.en.frame').map((x) => oneOf(x, 'act')));
  const roleOf = (frame, act, role) => {
    const x = maps.find((y) => oneOf(y, 'frame') === frame && oneOf(y, 'role') === role) ?? maps.find((y) => !oneOf(y, 'frame') && oneOf(y, 'act') === act && oneOf(y, 'role') === role && !oneOf(y, 'takes'))
      ?? maps.find((y) => !oneOf(y, 'frame') && oneOf(y, 'act') === act && oneOf(y, 'role') === role);
    return x ? (oneOf(x, 'marker') === 'yes' ? null : oneOf(x, 'act_role')) : role;
  };
  const groups = {};
  const examples = { kept: [], act: [], unread: [] };
  for (const r of rows) {
    if (!r.ref?.complete || r.ref.segments !== 1 || !r.ref.action) continue;
    const act = r.ref.action.split('.').pop();
    if (!actNames.has(act)) continue;
    const args = Object.fromEntries([...r.ref.key.matchAll(/arg\.([\w.]+)="((?:[^"\\]|\\.)*)"/g)].map((x) => [x[1], x[2]]));
    const g = (groups[['authored', 'hand', 'owner'].includes(r.ro_by) ? 'hand Romanian' : 'machine Romanian'] ??= { rows: 0, read: 0, act: 0, roles: 0 });
    g.rows++;
    const [best] = reader.read(r.ro);
    if (!best) { if (examples.unread.length < 12) examples.unread.push(r.ro); continue; }
    g.read++;
    const refAct = modes.get(`${act} ${args.mode}`) ?? act;
    if (best.act !== refAct || (best.mode ?? null) !== (args.mode ?? null)) continue;
    g.act++;
    const en = best.frame && reader.enOf?.(best.frame);
    const want = new Set(Object.keys(args).filter((k) => k !== 'mode').map((k) => roleOf(en, act, k)).filter(Boolean));
    const got = new Set(Object.keys(best.args).filter((k) => !k.endsWith('.marker')));
    if (want.size === got.size && [...want].every((x) => got.has(x))) { g.roles++; if (examples.kept.length < 8) examples.kept.push(`${r.ro} -> ${best.act} ${JSON.stringify(best.args)}`); }
    else if (examples.act.length < 12) examples.act.push(`${r.ro} -> ${[...got]} vs ${[...want]}`);
  }
  void enFrames;
  return { groups, examples };
}
