// One name, one thing across worlds (Round 10, item 3): for every name that facts of more than one world carry,
// whether those facts are about the same thing, as k.attributes.same facts and the page docs/worlds/JOINS.md.
//   node tools/joins.mjs       writes docs/worlds/k.attributes/shards/same-*.sop and docs/worlds/JOINS.md
// How it is decided, by rule: every type that names things gives its things a sense (TYPES below): an animal of
// k.animals is an animal, a colour of k.colours a colour; a drawing of k.objects has the sense of the group of
// drawings it was filed in by its source (the shard: animals, food, plants, clothes; any other group: a thing;
// a mixed hand-written shard: unknown); a k.attributes.thing has the sense of its kind where the kind is an
// animal, a food, a plant, clothing or a person; facts about a drawing (place, size, drawn colour, anchor) have the
// sense of the drawing. Names are compared in lower case. A name whose facts have one sense (or one sense and
// some of unknown sense) is one thing; a name with two or more senses is a clash (orange the colour and the
// fruit; bat the animal and the thing), and each sense gets its own fact. Types that are keyed by the word,
// whatever it means (k.words.sense, k.parts), are listed apart (`by_word`): their gloss says what is meant.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from './sopworld/sopworld.mjs';
import { WORLDS_DIR, scanWorlds } from './lib/worlds.mjs';
import { wire, header, seg, writeShards, byText } from './import/lib.mjs';

const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
export const JOINS_PAGE = join(WORLDS_DIR, 'JOINS.md');
const SRC = 'hand-core 1';
export const SENSES = ['animal', 'food', 'plant', 'person', 'body part', 'clothing', 'colour', 'shape', 'place', 'time', 'body in space', 'thing'];
// The sense of a drawing, from the group its source filed it in (the name of its shard).
// Hand-written shards that mix kinds (nature holds a tree and a rock) and one mixed group of a source say nothing.
const MIXED = /^(nature|land|scenery|sky|places|more|figures)(-\d+)?$|animals-nature/;
const shardSense = (shard) => (MIXED.test(shard) ? null : /(^|-)animals?(-|$)/.test(shard) ? 'animal' : /kitchen-items/.test(shard) ? 'thing' : /(^|-)(food|drink)(-|$)/.test(shard) ? 'food'
  : /(^|-)plants?(-|$)/.test(shard) ? 'plant' : /(^|-)cloth(es|ing)(-|$)/.test(shard) ? 'clothing' : 'thing');
// A drawing of no special group (`thing`) can show a body in space, a part of the body, a plant, a person or a
// thing that is worn: the sun of k.space and the drawing sun are one thing, and so are the wearable apron and
// the drawing apron. It is another thing than an animal, a food, a colour, a shape, a time or a place with a
// proper name of the same spelling.
const WITH_THING = new Set(['body in space', 'body part', 'plant', 'person', 'clothing']);
const KIND_SENSE = { animal: 'animal', food: 'food', drink: 'food', plant: 'plant', clothing: 'clothing', jewellery: 'clothing', person: 'person' };
// [type, the key that names the thing, the sense: a name, null (unknown), 'drawing' (that of the drawing of the
// name), 'word' (keyed by the word) or a function of the wire and its shard].
export const TYPES = [
  ['k.objects.object', 'name', (w, shard) => shardSense(shard)], ['k.objects.stand_in', 'name', null],
  ['k.animals.animal', 'name', 'animal'], ['k.food.food', 'name', 'food'],
  ['k.colours.colour', 'name', 'colour'], ['k.values.colour', 'name', 'colour'], ['k.shapes.shape', 'name', 'shape'], ['k.values.shape', 'name', 'shape'],
  ['k.body.part', 'name', 'body part'], ['k.wearables.wearable', 'name', 'clothing'], ['k.people.kind', 'name', 'person'], ['k.people.role', 'name', 'person'],
  ['k.space.body', 'name', 'body in space'], ['k.space.kind', 'name', 'body in space'],
  ['k.geo.continent', 'name', 'place'], ['k.geo.country', 'name', 'place'], ['k.geo.city', 'name', 'place'], ['k.geo.river', 'name', 'place'], ['k.geo.mountain', 'name', 'place'], ['k.geo.range', 'name', 'place'], ['k.geo.lake', 'name', 'place'], ['k.geo.desert', 'name', 'place'], ['k.geo.sea', 'name', 'place'],
  ['k.time.month', 'name', 'time'], ['k.time.weekday', 'name', 'time'], ['k.time.season', 'name', 'time'], ['k.time.duration', 'name', 'time'],
  ['k.attributes.thing', 'name', (w) => KIND_SENSE[tok(w.attrs.kind?.[0])] ?? null],
  ['k.scenes.thing', 'name', 'drawing'], ['k.attributes.drawn', 'name', 'drawing'], ['k.layouts.anchor', 'of', 'drawing'],
  ['k.commonsense.thing', 'name', null],
  ['k.words.sense', 'word', 'word'], ['k.parts.whole', 'name', 'word'], ['k.parts.inherited', 'name', 'word'], ['k.parts.usual', 'name', 'word'], ['k.parts.called', 'of', 'word'],
];

export function joins(worlds = scanWorlds()) {
  const typeOf = new Map(TYPES.map((t) => [t[0], t]));
  // name (lower case) -> type -> Set of senses (null: unknown).
  const names = new Map();
  const spelt = new Map();
  for (const world of worlds) for (const shard of world.shards) {
    const shardName = shard.id.split('/').pop();
    if (shardName.startsWith('same-')) continue;
    for (const w of parse(shard.text)) {
      const t = typeOf.get(w.type);
      if (!t || (w.type === 'k.words.sense' && w.attrs.pos?.[0] !== 'noun')) continue;
      for (const raw of w.attrs[t[1]] ?? []) {
        const name = tok(raw), key = name.toLowerCase();
        if (!spelt.has(key) || name === key) spelt.set(key, name);
        if (!names.has(key)) names.set(key, new Map());
        const m = names.get(key);
        if (!m.has(w.type)) m.set(w.type, new Set());
        m.get(w.type).add(typeof t[2] === 'function' ? t[2](w, shardName) : t[2]);
      }
    }
  }
  const worldOf = (type) => type.split('.').slice(0, 2).join('.');
  const rows = [];
  for (const [name, types] of [...names.entries()].sort((a, b) => byText(a[0], b[0]))) {
    const byWord = [...types.entries()].filter(([, s]) => s.has('word')).map(([t]) => t);
    const meant = [...types.entries()].filter(([, s]) => !s.has('word'));
    if (new Set([...types.keys()].map(worldOf)).size < 2 || meant.length === 0) continue;
    if (meant.length === 1 && byWord.every((t) => worldOf(t) === worldOf(meant[0][0]))) continue;
    // The sense of the drawing of the name, for the facts about that drawing.
    const drawing = [...(types.get('k.objects.object') ?? [])][0] ?? ([...(types.get('k.animals.animal') ?? [])][0] ?? null);
    const bySense = new Map(), unsure = [];
    for (const [type, senses] of meant) for (const s0 of senses) {
      const s = s0 === 'drawing' ? drawing : s0;
      if (s === null || s === undefined) { unsure.push(type); continue; }
      if (!bySense.has(s)) bySense.set(s, new Set());
      bySense.get(s).add(type);
    }
    if (bySense.has('thing') && bySense.size === 2) {
      const other = [...bySense.keys()].find((k) => k !== 'thing');
      if (WITH_THING.has(other)) { for (const t of bySense.get('thing')) bySense.get(other).add(t); bySense.delete('thing'); }
    }
    const senses = [...bySense.keys()].sort((a, b) => SENSES.indexOf(a) - SENSES.indexOf(b));
    if (senses.length === 0) { rows.push({ name, sense: 'thing', in: [...new Set(unsure)].sort(byText), unsure: [], byWord, only: true }); continue; }
    if (senses.length === 1) { rows.push({ name, sense: senses[0], in: [...new Set([...bySense.get(senses[0]), ...unsure])].sort(byText), unsure: [], byWord, only: true }); continue; }
    for (const s of senses) rows.push({ name, sense: s, in: [...bySense.get(s)].sort(byText), unsure: [...new Set(unsure)].sort(byText), byWord, only: false });
  }
  return { rows, spelt };
}

export function joinShards({ rows } = joins()) {
  const files = {};
  const letter = (n) => (/^[a-z]/.test(n) ? n[0] : '0');
  for (const l of [...new Set(rows.map((r) => letter(r.name)))].sort(byText)) {
    const mine = rows.filter((r) => letter(r.name) === l);
    const lines = mine.map((r) => wire(`k.attributes.same.${seg(r.name)}.${seg(r.sense)}`, 'k.attributes.same', [['name', r.name], ['sense', r.sense], ['only', String(r.only)], ...r.in.map((t) => ['in', t]), ...r.unsure.map((t) => ['unsure', t]), ...r.byWord.map((t) => ['by_word', t])], SRC));
    files[`same-${l}.sop`] = `${header({ id: `k.attributes/shards/same-${l}`, about: `one name, one thing: for ${new Set(mine.map((r) => r.name)).size} names that start with "${l === '0' ? 'a digit or another sign' : l}" and are carried by facts of more than one world, the sense of the name and the types whose facts are about that thing; a name with two senses has two facts (${mine.filter((r) => !r.only).length} facts of such names here).`,
      sources: ['hand-core 1 (computed from the shards of the catalog by tools/joins.mjs)'], license: 'CC0-1.0', script: 'tools/joins.mjs' })}\n${lines.join('\n')}\n`;
  }
  return files;
}

export function joinsPage({ rows }) {
  const names = new Map();
  for (const r of rows) { if (!names.has(r.name)) names.set(r.name, []); names.get(r.name).push(r); }
  const clashes = [...names.entries()].filter(([, rs]) => !rs[0].only);
  const worldOf = (type) => type.split('.').slice(0, 2).join('.');
  const pairs = new Map();
  for (const [, rs] of names) if (rs[0].only) { const ws = [...new Set(rs[0].in.map(worldOf))].sort(byText); for (let i = 0; i < ws.length; i++) for (let j = i + 1; j < ws.length; j++) { const k = `${ws[i]} | ${ws[j]}`; pairs.set(k, (pairs.get(k) ?? 0) + 1); } }
  const bySense = new Map();
  for (const [, rs] of names) if (rs[0].only) bySense.set(rs[0].sense, (bySense.get(rs[0].sense) ?? 0) + 1);
  const short = (t) => `\`${t}\``;
  const lines = ['# One name, one thing across worlds', '',
    'Generated by `tools/joins.mjs` from the shards; do not edit by hand. The facts are `k.attributes.same`',
    '(shards `k.attributes/shards/same-<letter>`): for a name carried by facts of more than one world, its `sense`',
    'and the types (`in`) whose facts with that name are about that one thing. `only=true`: the name has one sense',
    'in the catalog, so a host may treat the thing as one thing in every view. `only=false`: the name has two or',
    'more senses, each with its own fact; a host must not join facts across them (an orange drawing is the fruit,',
    '`k.colours` orange is the colour). `unsure` lists types whose fact gives no sense by itself; `by_word` the',
    'types keyed by the word whatever it means (`k.words.sense`, `k.parts`): their gloss says which sense.', '',
    'How a sense is found is a rule, not a reading of each name: see the head of `tools/joins.mjs`. A drawing has',
    'the sense of the group its source filed it in, so a clash can be missed where that group says nothing, and a',
    'clash is reported where two worlds use one name for a thing and for what it is made into (chicken, the bird',
    'and the meat).', '',
    '## Numbers', '',
    `- names carried by facts of more than one world: ${names.size}`,
    `- one thing everywhere: ${names.size - clashes.length}`,
    `- clashes of sense: ${clashes.length}`, '',
    '| sense of the one thing | names |', '|---|---:|',
    ...SENSES.filter((s) => bySense.has(s)).map((s) => `| ${s} | ${bySense.get(s)} |`), '',
    '## Clashes of sense', '',
    '| name | senses and where |', '|---|---|',
    ...clashes.map(([n, rs]) => `| ${n} | ${rs.map((r) => `**${r.sense}**: ${r.in.map(short).join(', ')}`).join('; ')}${rs[0].unsure.length ? `; unsure: ${rs[0].unsure.map(short).join(', ')}` : ''} |`), '',
    '## Worlds joined by a name', '', 'How many names that are one thing two worlds share (the 40 largest pairs).', '', '| worlds | names |', '|---|---:|',
    ...[...pairs.entries()].sort((a, b) => b[1] - a[1] || byText(a[0], b[0])).slice(0, 40).map(([k, n]) => `| \`${k.replace(' | ', '` and `')}\` | ${n} |`)];
  return `${lines.join('\n')}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const j = joins();
  writeShards(join(WORLDS_DIR, 'k.attributes', 'shards'), joinShards(j), 'same-');
  writeFileSync(JOINS_PAGE, joinsPage(j));
  const names = new Set(j.rows.map((r) => r.name));
  console.log(`${names.size} names, ${j.rows.length} facts, ${new Set(j.rows.filter((r) => !r.only).map((r) => r.name)).size} clashes`);
}
