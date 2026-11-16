// k.expect (owner's GO, reviewer block 2026-11-15 14:00, item 3): what a reasonable person expects when they ask for a
// thing and do not say everything. The amounts, the scale and the makes of common things are hand-written here
// (hand-core 1, CC0); the expectations of the scenes come from k.scenes has (the parts of each scene and their counts)
// and those of the kinds of diagram from k.diagrams (roles, shapes, layouts). Each derived fact keeps the source of the
// fact it comes from (all hand-core 1 today; a fact of another licence would go to a shard of its own).
//   node tools/expect-core.mjs     writes docs/worlds/k.expect/shards/{hand,scenes,diagrams}.sop
import { join } from 'node:path';
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { WORLDS_DIR } from './lib/worlds.mjs';
import { wire, header, seg, text } from './import/lib.mjs';
import { parse } from './sopworld/sopworld.mjs';

const SRC = 'hand-core 1';
const DIR = join(WORLDS_DIR, 'k.expect', 'shards');
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const one = (w, k) => tok(w.attrs[k]?.[0]);
const many = (w, k) => (w.attrs[k] ?? []).map(tok);
const factsOf = (world, type) => readdirSync(join(WORLDS_DIR, world, 'shards')).filter((f) => f.endsWith('.sop')).sort()
  .flatMap((f) => parse(readFileSync(join(WORLDS_DIR, world, 'shards', f), 'utf8'))).filter((w) => w.type === type);

// name, min, max, typical, about (an absolute amount); or name, null, null, null, about, min_factor, max_factor.
export const AMOUNTS = [
  ['one', 1, 1, 1, 'a single one'],
  ['couple', 2, 3, 2, 'a couple: two, at most three'],
  ['few', 2, 4, 3, 'a few: more than one, fewer than five'],
  ['some', 2, 5, 3, 'some: a few, not counted'],
  ['handful', 3, 6, 5, 'a handful: about five'],
  ['several', 3, 7, 5, 'several: more than a few, fewer than many'],
  ['many', 6, 12, 8, 'many, lots of: clearly more than usual'],
  ['dozen', 12, 12, 12, 'a dozen: twelve'],
  ['about', null, null, null, 'about N, around N, N or so: from 0.8 to 1.25 times N', 0.8, 1.25],
];

// step, order, count factor, size factor, extent, about
export const SCALE = [
  ['tiny', 1, 0.4, 0.4, 0.1, 'tiny: very few parts, each very small, a tenth of the canvas'],
  ['small', 2, 0.6, 0.7, 0.25, 'small, in a corner: fewer parts, smaller, a quarter of the canvas'],
  ['default', 3, 1, 1, 0.6, 'what is made when no size is said: the typical count, most of the canvas with a margin'],
  ['big', 4, 1.5, 1.4, 0.85, 'big, large: more parts, bigger, almost the whole canvas'],
  ['huge', 5, 2.2, 2, 1, 'huge, the whole page: many more parts, the whole canvas'],
];

// The hand-written makes: thing, made_in, unit, min, max, typical, kinds_min, kinds_max, layout, extent, scene,
// diagram, length_unit, length, varies, about, parts [part, group, min, max, typical, needed, where, shapes, role, slots] (`slots`: the k.faces slots a part is drawn as, one name per part here and the slot names there).
export const MAKES = [
  ['diagram', 'diagram', 'node', 5, 9, 7, 2, 3, 'top_down', 'default', null, null, null, null, ['count', 'kinds', 'layout', 'colour'],
    'a diagram with no kind said: 5 to 9 nodes (seven plus or minus two, what a reader takes in at once) of two or three shapes, joined by links, in a named layout',
    [['node', 'node', 5, 9, 7, 'yes', null, ['rectangle', 'rounded_rectangle', 'circle', 'diamond', 'oval'], null], ['link', 'link', 4, 12, 7, 'yes', null, [], null]]],
  ['pond', 'drawing', 'part', 4, 9, 6, 3, 4, 'free', 'default', 'pond', null, null, null, ['count', 'kinds', 'place'],
    'a pond: water, a few water plants and one or two animals, a stone or grass at the edge',
    [['water', 'water', 1, 1, 1, 'yes', 'ground', [], null], ['water lily', 'plant', 2, 5, 3, null, 'water', [], null], ['reed', 'plant', 0, 4, 2, null, 'water', [], null],
      ['duck', 'animal', 0, 2, 1, null, 'water', [], null], ['frog', 'animal', 0, 2, 1, null, 'water', [], null], ['goldfish', 'animal', 0, 3, 1, null, 'water', [], null],
      ['stone', 'ground', 0, 3, 2, null, 'foreground', [], null], ['grass', 'ground', 0, 5, 3, null, 'foreground', [], null]]],
  ['house', 'drawing', 'part', 4, 9, 6, 4, 6, 'free', 'default', null, null, null, null, ['colour', 'kinds', 'size'],
    'a house: walls, a roof, a door and two to four windows; a chimney often',
    [['wall', 'body', 1, 1, 1, 'yes', 'ground', [], null], ['roof', 'body', 1, 1, 1, 'yes', 'ground', [], null], ['door', 'opening', 1, 2, 1, 'yes', 'ground', [], null],
      ['window', 'opening', 1, 6, 2, null, 'ground', [], null], ['chimney', 'body', 0, 1, 1, null, 'ground', [], null]]],
  ['tree', 'drawing', 'part', 2, 4, 2, 2, 3, 'free', 'default', null, null, null, null, ['colour', 'size'],
    'a tree: a trunk and a crown of leaves; fruit or a bird sometimes',
    [['trunk', 'body', 1, 1, 1, 'yes', 'ground', [], null], ['crown', 'body', 1, 1, 1, 'yes', 'ground', [], null], ['fruit', 'extra', 0, 8, 0, null, 'ground', [], null]]],
  ['garden', 'drawing', 'part', 5, 14, 9, 3, 5, 'free', 'default', 'garden', null, null, null, ['count', 'kinds', 'place', 'colour'],
    'a garden: grass, flowers, a tree or a bush, maybe a fence and a bench, a butterfly or a bird',
    [['grass', 'ground', 1, 1, 1, 'yes', 'ground', [], null], ['flower', 'plant', 3, 10, 5, 'yes', 'ground', [], null], ['tree', 'plant', 0, 2, 1, null, 'ground', [], null],
      ['bush', 'plant', 0, 3, 1, null, 'ground', [], null], ['fence', 'building', 0, 1, 1, null, 'background', [], null], ['bench', 'building', 0, 1, 0, null, 'ground', [], null],
      ['butterfly', 'animal', 0, 3, 1, null, 'sky', [], null], ['bird', 'animal', 0, 2, 1, null, 'sky', [], null]]],
  ['street', 'drawing', 'part', 5, 14, 9, 3, 5, 'row', 'default', 'city street', null, null, null, ['count', 'kinds', 'colour'],
    'a street: a road, houses or shops along it, a car or two, a tree, a lamp',
    [['road', 'ground', 1, 1, 1, 'yes', 'ground', [], null], ['house', 'building', 2, 6, 3, 'yes', 'background', [], null], ['car', 'vehicle', 0, 3, 2, null, 'ground', [], null],
      ['tree', 'plant', 0, 4, 2, null, 'background', [], null], ['street lamp', 'building', 0, 3, 1, null, 'ground', [], null]]],
  ['story', 'document', 'chapter', 1, 5, 3, 3, 5, null, 'default', null, null, 'word', 400, ['topic', 'count'],
    'a short story: a beginning, a problem, an end; about 400 words in three chapters or paragraphs, a hero and one or two other characters',
    [['chapter', 'text', 1, 5, 3, 'yes', null, [], null], ['character', 'person', 1, 4, 2, 'yes', null, [], null]]],
  ['poem', 'document', 'stanza', 2, 6, 3, 1, 2, null, 'default', null, null, 'line', 12, ['topic'],
    'a short poem: three stanzas of four lines', [['stanza', 'text', 2, 6, 3, 'yes', null, [], null]]],
  ['essay', 'document', 'paragraph', 3, 7, 5, 3, 3, null, 'default', null, null, 'word', 600, ['topic'],
    'an essay: an introduction, three body paragraphs, a conclusion; about 600 words', [['paragraph', 'text', 3, 7, 5, 'yes', null, [], null]]],
  ['bar chart', 'chart', 'bar', 3, 10, 6, 1, 1, null, 'default', null, null, null, null, ['count', 'colour'],
    'a bar chart: 3 to 10 bars, one per category, an axis and labels', [['bar', 'mark', 3, 10, 6, 'yes', null, [], null]]],
  ['list', 'list', 'item', 3, 12, 6, 1, 1, null, 'default', null, null, null, null, ['count'],
    'a list: about six entries', [['item', 'item', 3, 12, 6, 'yes', null, [], null]]],
  ['song', 'music', 'bar', 8, 32, 16, 1, 3, null, 'default', null, null, null, null, ['count'],
    'a short tune: 16 bars of four beats', [['bar', 'music', 8, 32, 16, 'yes', null, [], null]]],
  ['face', 'face', 'part', 5, 9, 7, 5, 9, null, 'default', null, null, null, null, ['colour', 'kinds'],
    'a face: head, eyes, nose, mouth, hair; ears and eyebrows often',
    [['head', 'face', 1, 1, 1, 'yes', null, [], null, ['head']], ['eye', 'face', 2, 2, 2, 'yes', null, [], null, ['eyes']], ['mouth', 'face', 1, 1, 1, 'yes', null, [], null, ['mouth']], ['nose', 'face', 0, 1, 1, null, null, [], null, ['nose']], ['hair', 'face', 0, 1, 1, null, null, [], null, ['hair_front', 'hair_back']],
      ['ear', 'face', 0, 2, 2, null, null, [], null, ['ears']], ['eyebrow', 'face', 0, 2, 2, null, null, [], null, ['eyebrows']]]],
];

// How many nodes a role of a kind of diagram usually has (min, max, typical); a role not listed: 0 to 2, 1.
const ROLE_COUNT = { start: [1, 1, 1], end: [1, 1, 1], process: [2, 6, 3], decision: [1, 2, 1], data: [0, 2, 0], document: [0, 1, 0], subprocess: [0, 2, 0], connector: [0, 2, 0],
  root: [1, 1, 1], item: [4, 8, 6], stage: [3, 7, 5], event: [4, 9, 6], node: [5, 9, 7], centre: [1, 1, 1], branch: [3, 8, 5], post: [4, 9, 6], set: [2, 3, 2], row: [2, 6, 4], column: [2, 5, 3], cell: [4, 30, 12] };

const makeWire = (id, m, src) => wire(id, 'k.expect.make', [
  ['thing', m.thing], ['made_in', m.made_in], ['unit', m.unit], ['min', m.min], ['max', m.max], ['typical', m.typical], ['kinds_min', m.kinds_min], ['kinds_max', m.kinds_max],
  ['layout', m.layout], ['extent', m.extent], ['scene', m.scene], ['diagram', m.diagram], ['length_unit', m.length_unit], ['length', m.length],
  ...(m.varies ?? []).map((v) => ['varies', v]), ['about', text(m.about)]], src);
const partWire = (id, p, src) => wire(id, 'k.expect.part', [
  ['of', p.of], ['part', p.part], ['group', p.group], ['min', p.min], ['max', p.max], ['typical', p.typical], ['needed', p.needed], ['where', p.where],
  ...(p.shapes ?? []).map((s) => ['shape', s]), ['role', p.role], ...(p.slots ?? []).map((s) => ['slot', s])], src);

function hand() {
  const out = [];
  out.push('', '# The named amounts.');
  for (const [name, min, max, typical, about, minf, maxf] of AMOUNTS) out.push(wire(`k.expect.amount.${name}`, 'k.expect.amount', [['name', name], ['min', min], ['max', max], ['typical', typical], ['min_factor', minf], ['max_factor', maxf], ['about', text(about)]], SRC));
  out.push('', '# The scale of size and extent.');
  for (const [step, order, cf, sf, ex, about] of SCALE) out.push(wire(`k.expect.scale.${step}`, 'k.expect.scale', [['step', step], ['order', order], ['count_factor', cf], ['size_factor', sf], ['extent', ex], ['about', text(about)]], SRC));
  out.push('', '# The makes of common things, hand-checked.');
  for (const [thing, made_in, unit, min, max, typical, kinds_min, kinds_max, layout, extent, scene, diagram, length_unit, length, varies, about, parts] of MAKES) {
    out.push(makeWire(`k.expect.make.${seg(thing)}`, { thing, made_in, unit, min, max, typical, kinds_min, kinds_max, layout, extent, scene, diagram, length_unit, length, varies, about }, SRC));
    for (const [part, group, pmin, pmax, ptyp, needed, where, shapes, role, slots] of parts) out.push(partWire(`k.expect.part.${seg(thing)}.${seg(part)}`, { of: thing, part, group, min: pmin, max: pmax, typical: ptyp, needed, where, shapes, role, slots }, SRC));
  }
  return out;
}

// A scene of k.scenes as a make "<scene> scene": its parts with their counts as typical, from half to twice the count;
// the thing the scene is named after and the parts that fill a region are needed. Kinds: at least three (or all), at
// most all; the default draws about six kinds.
function scenes() {
  const has = factsOf('k.scenes', 'k.scenes.has');
  const by = new Map();
  for (const h of has) { const s = one(h, 'scene'); if (!by.has(s)) by.set(s, []); by.get(s).push(h); }
  const out = [];
  for (const [scene, hs] of [...by].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
    const thing = `${scene} scene`, n = hs.length, total = hs.reduce((t, h) => t + Number(one(h, 'count')), 0);
    const kindsTyp = Math.min(6, n), src = one(hs[0], 'core.source');
    const minParts = hs.filter((h) => one(h, 'fills') === 'true' || one(h, 'thing') === scene).length || Math.min(3, n);
    out.push('', makeWire(`k.expect.make.${seg(thing)}`, { thing, made_in: 'drawing', unit: 'part', min: Math.max(minParts, Math.min(3, n)), max: total, typical: Math.max(Math.min(3, n), Math.round(total * kindsTyp / n)),
      kinds_min: Math.min(3, n), kinds_max: n, layout: 'free', extent: 'default', scene, varies: ['count', 'kinds', 'place'], about: `the scene ${scene} of k.scenes: ${n} kinds of parts, ${total} things in the full scene; the default draws about ${kindsTyp} kinds` }, src));
    for (const h of hs) {
      const c = Number(one(h, 'count')), part = one(h, 'thing');
      const needed = one(h, 'fills') === 'true' || part === scene ? 'yes' : undefined;
      out.push(partWire(`k.expect.part.${seg(thing)}.${seg(part)}`, { of: thing, part, group: one(h, 'where'), min: needed ? 1 : 0, max: c * 2, typical: c, needed, where: one(h, 'where') }, one(h, 'core.source')));
    }
  }
  return out;
}

// A kind of diagram of k.diagrams as a make: 5 to 9 nodes (the generic diagram's), of the shapes its roles are drawn
// with (at most three kinds), in its first layout; each role with a shape is a part, with the usual count of the role.
function diagrams() {
  const kinds = factsOf('k.diagrams', 'k.diagrams.kind'), shapes = factsOf('k.diagrams', 'k.diagrams.shape');
  const out = [];
  for (const k of kinds) {
    const kind = one(k, 'name'), mine = shapes.filter((s) => one(s, 'kind') === kind);
    // A kind named like a hand-written make (tree: the plant) is "<kind> diagram".
    const name = MAKES.some((m) => m[0] === kind) ? `${kind} diagram` : kind;
    const distinct = [...new Set(mine.map((s) => one(s, 'shape')))];
    const layout = many(k, 'arranged')[0] ?? many(k, 'layout')[0];
    out.push('', makeWire(`k.expect.make.${seg(name)}`, { thing: name, made_in: 'diagram', unit: 'node', min: 5, max: 9, typical: 7, kinds_min: Math.min(distinct.length || 1, 2), kinds_max: Math.max(1, Math.min(distinct.length, 3)),
      layout, extent: 'default', diagram: kind, varies: ['count', 'kinds', 'colour'], about: `a ${kind} of k.diagrams: 5 to 9 nodes, ${distinct.length ? `drawn as ${distinct.join(', ')}` : 'no fixed shapes'}, laid out ${layout}, edges ${one(k, 'edges')}` }, one(k, 'core.source')));
    for (const s of mine) {
      const role = one(s, 'role'), [min, max, typical] = ROLE_COUNT[role] ?? [0, 2, 1];
      out.push(partWire(`k.expect.part.${seg(name)}.${seg(role)}`, { of: name, part: role, group: 'node', min, max, typical, needed: min > 0 ? 'yes' : undefined, shapes: [one(s, 'shape')], role }, one(s, 'core.source')));
    }
    if (one(k, 'edges') !== 'none') out.push(partWire(`k.expect.part.${seg(name)}.link`, { of: name, part: 'link', group: 'link', min: 4, max: 12, typical: 7, needed: 'yes' }, SRC));
  }
  return out;
}

export function build() {
  mkdirSync(DIR, { recursive: true });
  const files = {
    'hand.sop': [header({ id: 'k.expect/shards/hand', about: 'the named amounts (a few, several, many, about N), the scale of size and extent (tiny to huge) and the makes of common things (diagram, pond, house, tree, garden, street, story, poem, essay, bar chart, list, song, face) with their parts, hand-checked.', sources: ['hand-core 1 (hand-written in this repository: tools/expect-core.mjs)'], license: 'CC0-1.0', script: 'tools/expect-core.mjs' }), ...hand()],
    'scenes.sop': [header({ id: 'k.expect/shards/scenes', about: 'the scenes of k.scenes as makes: each scene\'s parts with their counts as typical, from half to twice the count; derived from k.scenes has.', sources: ['hand-core 1 (the k.scenes has facts, hand-written in this repository; derived by tools/expect-core.mjs)'], license: 'CC0-1.0', script: 'tools/expect-core.mjs' }), ...scenes()],
    'diagrams.sop': [header({ id: 'k.expect/shards/diagrams', about: 'the kinds of diagram of k.diagrams as makes: 5 to 9 nodes, the shapes of their roles, their first layout; derived from k.diagrams kinds and shapes.', sources: ['hand-core 1 (the k.diagrams facts, hand-written in this repository; derived by tools/expect-core.mjs)'], license: 'CC0-1.0', script: 'tools/expect-core.mjs' }), ...diagrams()],
  };
  for (const [f, lines] of Object.entries(files)) writeFileSync(join(DIR, f), lines.join('\n').replace(/\n\n\n+/g, '\n\n') + '\n');
  return files;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const files = build();
  for (const [f, lines] of Object.entries(files)) console.log(f, lines.filter((l) => l.startsWith('@')).length, 'wires');
}
