// Block "00:05" item 1 (reviewer, 2026-11-15): which keys of the catalog a composition may narrate, how salient each is,
// and in which form it is said. PSys2's first compositions narrated metadata ("Chad has a code of TCD, a formal of
// Republic of Chad") and said every attribute as "has a X of Y". One fact `k.attributes.narration` per slot of every
// k.* type, computed by rules from what the catalog already says, nothing typed per key:
//
//  narrate=no, with `why`, for
//   - the keys of machinery types: types that say how to draw, move, plan, compose, read or describe the catalog
//     (k.faces, k.motion, k.procedures, k.genres, k.layouts, the attribute catalogue itself...; MACHINERY below);
//   - the naming key of a thing (its subject, not an attribute of it), and the id keys of a type with no naming key
//     (k.colours.mix: red and yellow give orange; its subject is the pair);
//   - identifiers and metadata by the key's name (codes, formal names, sources and citations, derived marks, joins to
//     drawings and senses, internal positions and ranks, coordinates, colour codes; KEY_NO below);
//   - a number k.units.measure places in a drawing frame (`frame=`);
//   - a key named as a slot of the drawn face (k.faces.slot: hat, beard, mouth) outside k.faces: a join to a drawing;
//   - a key whose values are catalog ids, `$` references or colour codes (checked on the facts);
//  narrate=yes for every other key, with
//   - `form`: how it is said, language-neutral (w.lang.en's phrasing templates say it in English): `state` (a boolean:
//     "Chad is landlocked"), `count` (a number of parts, k.units.measure `counts` names the part: "a hen has 2 legs"),
//     `measure` (another number: "the population of Chad is 16 million"), `kind` (what kind of thing it is: "a hen
//     is a bird"), `text` (a sentence or phrase of its own: a gloss, what a part does), `relation` (any other value: a
//     thing, a place, a colour: "the capital of Chad is N'Djamena", "a cow eats grass");
//   - `salience` in [0, 1]: the typicality weight k.attributes.typical gives the key (directly by type, or through
//     k.attributes.found from a kind's attribute) where there is one; else 0.4 x asked (the key is asked in
//     tests/*.questions.jsonl: 1 for two questions or more, 0.5 for one) + 0.3 x shown (k.attributes.shows lists it
//     for a family) + 0.3 x coverage (share of the type's facts that have the key). Measured, not chosen per key.
//   node tools/narration-core.mjs     writes docs/worlds/k.attributes/shards/narration.sop
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from './sopworld/sopworld.mjs';
import { WORLDS_DIR, REPO } from './lib/worlds.mjs';

const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const one = (w, k) => tok(w.attrs[k]?.[0]);
const q = (s) => (/^[a-z][\w.]*$/.test(String(s)) ? String(s) : JSON.stringify(String(s)));

// Types that are machinery, not things a composition is about: by world (every type of it) or by type.
export const MACHINERY = {
  'k.motion': 'how a drawn face moves over time', 'k.procedures': 'how goals are reached, steps for a planner',
  'k.genres': 'how documents are built', 'k.interest': 'how interest is computed', 'k.story': 'how stories are built',
  'k.layouts': 'where things are placed in a drawing', 'k.drawing': 'the geometry of drawings', 'k.faces': 'the parts of a drawn face',
  'k.objects': 'drawings and their parts', 'k.named': 'a helper type of names', 'k.kinds': 'the up edges of the catalog, generated',
  'k.attributes.attribute': 'the catalogue of attributes', 'k.attributes.switch': 'the catalogue of attributes', 'k.attributes.found': 'the catalogue of attributes',
  'k.attributes.kind': 'the catalogue of attributes', 'k.attributes.drawn': 'the colours of drawings', 'k.attributes.same': 'joins between the worlds, generated',
  'k.attributes.aspect': 'the catalogue of attributes', 'k.attributes.family': 'the catalogue of attributes', 'k.attributes.shows': 'the catalogue of attributes',
  'k.attributes.range': 'typical ranges for a reader that compares numbers', 'k.attributes.typical': 'typicality weights for a sampler',
  'k.attributes.narration': 'this table', 'k.units.measure': 'the units of the catalog\'s numbers', 'k.words.frequency': 'word frequencies for lexical choice',
  'k.actions.act': 'the acts a host performs', 'k.actions.role': 'the acts a host performs', 'k.actions.verb': 'the words of the acts',
  'k.actions.marking': 'the words of the acts', 'k.actions.family': 'families of the acts', 'k.actions.member': 'families of the acts',
  'k.actions.similar': 'the words of everyday actions', 'k.commonsense.placed': 'facts for rules', 'k.commonsense.lives': 'facts for rules',
  'k.time.ordered': 'orders for the time solver', 'k.time.before': 'orders for the time solver, derived', 'k.time.during': 'spans for the time solver, derived',
  'k.time.season_in': 'spans for the time solver, derived', 'k.scenes.has': 'what a drawn scene holds and where', 'k.values.scale': 'the words for values',
  'k.values.step': 'the words for values', 'k.values.comparative': 'the words for values', 'k.values.set_word': 'the words for values',
  'k.values.number': 'the words for values', 'k.values.fill': 'the words for values', 'k.values.shade': 'the words for values', 'k.values.reply': 'the words for values',
  'k.values.direction': 'the words for values', 'k.values.position': 'the words for values', 'k.values.coloured': 'the words for values',
};

// Keys that are identifiers or metadata wherever they stand, by name, each with why.
export const KEY_NO = [
  [/^(code\d*|iso\w*|qid|wikidata|id|\w+_id)$/, 'an identifier (a code)'],
  [/^formal$/, 'a formal name, metadata of the name'],
  [/^(source|cite|citations|doi|own|basis|as_of|unsure|approximate|by_word|derived|recognition)$/, 'metadata: where a fact comes from or how sure it is'],
  [/^reply$/, 'what a host says back, not a fact'],
  [/^(drawing|drawings|face|face_slot|stand_in|thing|css|in|sense)$/, 'a join to a drawing, a sense or another catalog entry'],
  [/^(n|rank|size_rank|steps|priority|offset|zipf|band|layer|order)$/, 'an internal number (a position, a rank, a step count)'],
  [/^supersense$/, 'a class of the dictionary (the WordNet lexicographer file), for type signatures'],
  [/^(lat|lon|west|south|east|north|x|y|z|w|h)$/, 'a coordinate'],
  [/^(rgb|rgb_about|shade|lightness|saturation)$/, 'a colour code'],
];
const NAMING = new Set(['name', 'text', 'word']);
const KIND_KEYS = new Set(['class', 'kind', 'is_a', 'kind_of', 'instance_of', 'is', 'botanically']);
const TEXT_KEYS = new Set(['about', 'gloss', 'does', 'used_for', 'result', 'caused_by', 'reply', 'colour_why', 'example', 'finding']);
const IDISH = /^(k|w|std)\.[a-z]|^\$|^#[0-9a-f]{6}$/i;
const plural = (w) => (/(s|x|ch|sh)$/.test(w) ? `${w}es` : /[^aeiou]y$/.test(w) ? `${w.slice(0, -1)}ies` : `${w}s`);

function readWorld(id) {
  const dir = join(WORLDS_DIR, id);
  const schema = parse(readFileSync(join(dir, 'schema.sop'), 'utf8'));
  const sd = join(dir, 'shards');
  const shards = existsSync(sd) ? readdirSync(sd).filter((f) => f.endsWith('.sop')).sort().map((f) => readFileSync(join(sd, f), 'utf8')) : [];
  return { id, schema, shards };
}

// Per type: how many facts, per key how many facts have it and a sample of values (a line scan: no full load).
function factStats(shards) {
  const stats = new Map();
  for (const text of shards) for (const line of text.split('\n')) {
    const m = line.match(/^@\S+ (\S+)/);
    if (!m || m[1].startsWith('core.')) continue;
    let s = stats.get(m[1]);
    if (!s) stats.set(m[1], s = { facts: 0, keys: new Map() });
    s.facts++;
    const seen = new Set();
    for (const [, k, v] of line.slice(m[0].length).matchAll(/ ([\w.]+)=("(?:[^"\\]|\\.)*"|\S+)/g)) {
      let ks = s.keys.get(k);
      if (!ks) s.keys.set(k, ks = { facts: 0, values: [] });
      if (!seen.has(k)) { ks.facts++; seen.add(k); }
      if (ks.values.length < 200) ks.values.push(tok(v));
    }
  }
  return stats;
}

export function narration(root = WORLDS_DIR) {
  const ids = readdirSync(root).filter((d) => d.startsWith('k.') && existsSync(join(root, d, 'schema.sop'))).sort();
  const worlds = ids.map(readWorld);
  const facts = (world, type) => worlds.find((w) => w.id === world).shards.flatMap((t) => parse(t)).filter((w) => w.type === type);
  const faceSlots = new Set(facts('k.faces', 'k.faces.slot').map((w) => one(w, 'name')));
  const measures = new Map(facts('k.units', 'k.units.measure').map((w) => [`${one(w, 'world')}.${one(w, 'type')}.${one(w, 'key')}`, w]));
  const typical = new Map(facts('k.attributes', 'k.attributes.typical').map((w) => [`${one(w, 'of')} ${one(w, 'attribute')}`, Number(one(w, 'weight'))]));
  const found = facts('k.attributes', 'k.attributes.found');
  const shows = new Set(facts('k.attributes', 'k.attributes.shows').map((w) => `${one(w, 'type')} ${one(w, 'key')}`));
  const asked = new Map();
  for (const f of readdirSync(join(REPO, 'tests')).filter((x) => x.endsWith('.questions.jsonl'))) {
    for (const line of readFileSync(join(REPO, 'tests', f), 'utf8').split('\n').filter(Boolean)) {
      const qq = JSON.parse(line).query;
      for (const k of [].concat(qq?.seek ?? [])) { const key = `${qq.type} ${k}`; asked.set(key, (asked.get(key) ?? 0) + 1); }
    }
  }
  // a kind's typical attribute reaches a key through k.attributes.found (animal legs -> k.animals.animal legs)
  const typicalOf = (type, key) => {
    if (typical.has(`${type} ${key}`)) return typical.get(`${type} ${key}`);
    const ws = found.filter((f) => one(f, 'type') === type && one(f, 'key') === key).flatMap((f) => [...typical].filter(([k]) => k.endsWith(` ${one(f, 'attribute')}`)).map(([, x]) => x));
    return ws.length ? Math.max(...ws) : null;
  };
  const rows = [];
  for (const w of worlds) {
    const stats = factStats(w.shards);
    const slots = w.schema.filter((x) => x.type === 'core.slot' && one(x, 'of').startsWith(`${w.id}.`));
    const firstId = new Map();
    for (const s of slots) if (one(s, 'id') === 'true' && !firstId.has(one(s, 'of'))) firstId.set(one(s, 'of'), one(s, 'key'));
    for (const s of slots) {
      const type = one(s, 'of'), key = one(s, 'key');
      const st = stats.get(type), ks = st?.keys.get(key);
      const row = { type, key };
      const mach = MACHINERY[type] ?? MACHINERY[w.id];
      const measure = measures.get(`${w.id}.${type.slice(w.id.length + 1)}.${key}`);
      const values = (ks?.values ?? []).map(String);
      let why = null;
      if (mach) why = `machinery: ${mach}`;
      else if (firstId.get(type) === key && NAMING.has(key)) why = 'the name of the thing: the subject, not an attribute';
      else if (one(s, 'id') === 'true' && !NAMING.has(firstId.get(type))) why = 'part of the subject of a fact of several keys (red and yellow give orange)';
      else if (KEY_NO.find(([re]) => re.test(key))) why = KEY_NO.find(([re]) => re.test(key))[1];
      else if (measure && one(measure, 'frame')) why = 'a coordinate in a drawing frame';
      else if (faceSlots.has(key)) why = 'a join to a part of the drawn face (k.faces)';
      else if (values.length && values.filter((v) => IDISH.test(v)).length > values.length / 2) why = 'its values are catalog ids or codes';
      if (why) { rows.push({ ...row, narrate: 'no', salience: 0, why }); continue; }
      const kind = one(s, 'kind');
      const base = key.replace(/_about$/, '');
      const counts = measure && one(measure, 'counts');
      const form = kind === 'boolean' ? 'state'
        : (kind === 'integer' || kind === 'number') ? (counts && (plural(counts) === base || counts === base) ? 'count' : 'measure')
          : KIND_KEYS.has(key) ? 'kind' : (TEXT_KEYS.has(key) || kind === 'string') ? 'text' : 'relation';
      const t = typicalOf(type, key);
      const a = asked.get(`${type} ${key}`) ?? 0;
      const coverage = st?.facts ? (ks?.facts ?? 0) / st.facts : 0;
      const salience = t ?? 0.4 * (a >= 2 ? 1 : a ? 0.5 : 0) + 0.3 * (shows.has(`${type} ${key}`) ? 1 : 0) + 0.3 * coverage;
      rows.push({ ...row, narrate: 'yes', salience: Math.round(salience * 100) / 100, form, basis: t !== null ? 'typical' : 'measured' });
    }
  }
  return rows;
}

export function narrationShard(rows) {
  const yes = rows.filter((r) => r.narrate === 'yes').length;
  const head = [
    `# k.attributes/shards/narration: which keys of the catalog a composition may narrate (${yes} of ${rows.length} slots of the k.* types), how salient each is and in which form it is said (block 00:05 item 1).`,
    '# sources: hand-core 1 (computed by rules from the catalog\'s own facts: k.attributes.typical and found, k.attributes.shows, k.units.measure, k.faces slots, tests/*.questions.jsonl)',
    '# license: CC0-1.0',
    '# script: tools/narration-core.mjs',
    '',
  ];
  const lines = rows.map((r) => `@k.attributes.narration.${r.type}.${r.key} k.attributes.narration type=${r.type} key=${r.key} narrate=${r.narrate} salience=${r.salience}`
    + `${r.form ? ` form=${r.form}` : ''}${r.basis ? ` basis=${r.basis}` : ''}${r.why ? ` why=${q(r.why)}` : ''} core.source="hand-core 1"`);
  return `${head.join('\n')}\n${lines.join('\n')}\n`;
}

if (process.argv[1]?.endsWith('narration-core.mjs')) {
  const rows = narration();
  writeFileSync(join(WORLDS_DIR, 'k.attributes/shards/narration.sop'), narrationShard(rows));
  const by = (k) => Object.entries(rows.reduce((m, r) => ({ ...m, [r[k] ?? '-']: (m[r[k] ?? '-'] ?? 0) + 1 }), {})).map(([x, n]) => `${x} ${n}`).join(', ');
  console.log(`narration: ${rows.length} slots; narrate ${by('narrate')}; form ${by('form')}; why ${by('why')}`);
}
