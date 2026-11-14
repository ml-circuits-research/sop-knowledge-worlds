// The diagram frames of w.lang.en (reviewer block 2026-11-15 06:00 item 1; shard diagram-frames,
// tools/lang-en-diagram-frames.mjs): the edit and request wording PSys2 measured in its DIAG-GAP set (psys2
// training/eval/diagram-gap-2026-11-15.jsonl, ids dg..) read back to the intended act and roles by the reference frame
// reader (tools/lib/lang-en.mjs) in a diagram world, and the joins of the lexicons the frames name to k.diagrams,
// w.diagram and the arrangement phrases.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from '../tools/sopworld/sopworld.mjs';
import { WORLDS_DIR } from '../tools/lib/worlds.mjs';
import { frameReader, toks } from '../tools/lib/lang-en.mjs';
import { diagramFrameShard, lexicons, TOPIC_HEADS } from '../tools/lang-en-diagram-frames.mjs';

const shardsOf = (id) => readdirSync(join(WORLDS_DIR, id, 'shards')).filter((f) => f.endsWith('.sop')).sort().map((f) => readFileSync(join(WORLDS_DIR, id, 'shards', f), 'utf8'));
const all = shardsOf('w.lang.en').flatMap((t) => parse(t));
const actions = shardsOf('k.actions').flatMap((t) => parse(t));
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const one = (w, k) => tok(w.attrs[k]?.[0]);
const vals = (w, k) => (w.attrs[k] ?? []).map(tok);
const schema = (id) => parse(readFileSync(join(WORLDS_DIR, id, 'schema.sop'), 'utf8'));
const kinds = shardsOf('k.diagrams').flatMap((t) => parse(t)).filter((w) => w.type === 'k.diagrams.kind');
const kindWords = schema('k.diagrams').filter((w) => w.type === 'core.word' && one(w, 'of') === 'k.diagrams.kind.name');
const arrangements = all.filter((w) => w.type === 'w.lang.en.arrangement');
const lex = (name) => vals(all.find((w) => w.type === 'w.lang.en.lex' && one(w, 'name') === name), 'item');

// the k.diagrams kind a word names (its name, or a word of it), and the diagram layout of a direction phrase
const kindOf = (w) => kinds.find((k) => one(k, 'name').toLowerCase() === w)?.attrs.name.map(tok)[0]
  ?? one(kindWords.find((x) => vals(x, 'text').map((t) => t.toLowerCase()).includes(w)) ?? { attrs: {} }, 'means');
const layoutOf = (phrase) => one(arrangements.find((a) => one(a, 'text') === phrase) ?? { attrs: {} }, 'diagram_layout');

// A diagram world: the frames with no needs and those a world of nodes and edges with attributes, values and layouts
// meets; a host's lexicons of that world (its kinds, attributes, values).
const NEEDS = new Set([undefined, 'attrs', 'values', 'layout', 'in', 'dir', 'scale', 'more', 'less', 'number', 'none', 'clear']);
const read = frameReader(all, actions, {
  needs: (n) => NEEDS.has(n),
  lexicons: { kind: ['box', 'circle', 'arrow', 'rectangle', 'diamond', 'node', 'shape', 'step', 'oval'], attribute: ['colour', 'size', 'label', 'shape', 'layout', 'text'], value: ['red', 'blue', 'green', 'diamond', 'circle', 'rectangle', 'oval'], more: ['bigger', 'larger'], less: ['smaller'], noun: ['box', 'arrow', 'circle'] },
});

// [request, id in the DIAG-GAP set or '' for a paraphrase, act/mode, args]
const LAYOUT = [
  ['make the arrows go left to right', 'dg19', 'place/layout', { thing: 'arrows', direction: 'left to right' }],
  ['lay the flow out left to right', 'dg20', 'place/layout', { thing: 'flow', direction: 'left to right' }],
  ['make the arrows go top to bottom', '', 'place/layout', { thing: 'arrows', direction: 'top to bottom' }],
  ['flow from left to right', '', 'place/layout', { direction: 'from left to right', thing: 'everything' }],
  ['make it flow from left to right', '', 'place/layout', { thing: 'it', direction: 'from left to right' }],
  ['the arrows should go from top to bottom', '', 'place/layout', { thing: 'arrows', direction: 'from top to bottom' }],
  ['arrange the steps from top to bottom', '', 'place/layout', { thing: 'steps', direction: 'from top to bottom' }],
  ['draw the flowchart top to bottom', '', 'place/layout', { thing: 'flowchart', direction: 'top to bottom' }],
  ['make the arrows point right to left', '', 'place/layout', { thing: 'arrows', direction: 'right to left' }],
  ['make the diagram go down the page', '', 'place/layout', { thing: 'diagram', direction: 'down the page' }],
];
const LABEL = [
  ['call the arrow yes', 'dg49', 'change/set', { thing: 'arrow', value: 'yes', attribute: 'label' }],
  ['label the arrow yes', 'dg47', 'change/set', { thing: 'arrow', value: 'yes', attribute: 'label' }],
  ['name the arrow yes', 'dg50', 'change/set', { thing: 'arrow', value: 'yes', attribute: 'label' }],
  ['label the arrow from A to B yes', 'dg48', 'change/set', { thing: 'arrow from a to b', value: 'yes', attribute: 'label' }],
  ["label the arrow from A to B 'no'", '', 'change/set', { thing: 'arrow from a to b', value: 'no', attribute: 'label' }],
  ['label the line between start and end no', '', 'change/set', { thing: 'line between start and end', value: 'no', attribute: 'label' }],
  ['write yes on the arrow', '', 'change/set', { value: 'yes', thing: 'arrow', attribute: 'label' }],
  ['put the label no on the arrow', '', 'change/set', { value: 'no', thing: 'arrow', attribute: 'label' }],
  ['mark the arrows as optional', '', 'change/set', { thing: 'arrows', value: 'optional', attribute: 'label' }],
];
const KINDS = [
  ['make a flowchart of making tea', 'dg21', 'make/', { kind: 'flowchart', topic: 'making tea' }],
  ['draw a flowchart for making tea', 'dg22', 'make/', { kind: 'flowchart', topic: 'making tea' }],
  ['a flowchart of how to make tea', 'dg23', 'make/', { kind: 'flowchart', topic: 'how to make tea' }],
  ['make a tree of the parts of a car', 'dg24', 'make/', { kind: 'tree', topic: 'parts of a car' }],
  ['draw a tree of the parts of a car', 'dg25', 'make/', { kind: 'tree', topic: 'parts of a car' }],
  ['a hierarchy of the parts of a car', 'dg26', 'make/', { kind: 'hierarchy', topic: 'parts of a car' }],
  ['make a cycle of the seasons', 'dg27', 'make/', { kind: 'cycle', topic: 'seasons' }],
  ['draw a cycle of the seasons', 'dg28', 'make/', { kind: 'cycle', topic: 'seasons' }],
  ['a cycle diagram of the four seasons', 'dg29', 'make/', { kind: 'cycle diagram', topic: 'four seasons' }],
  ['make a mind map about bees', 'dg33', 'make/', { kind: 'mind map', topic: 'bees' }],
  ['draw a mind map of bees', 'dg34', 'make/', { kind: 'mind map', topic: 'bees' }],
  ['a mind map about honey bees', 'dg35', 'make/', { kind: 'mind map', topic: 'honey bees' }],
  ['make a Venn diagram of birds and animals that fly', 'dg36', 'make/', { kind: 'venn diagram', topic: 'birds and animals that fly' }],
  ['draw an org chart of the school', '', 'make/', { kind: 'org chart', topic: 'school' }],
];
// The order criterion (block 07:45 item 1): an attribute that can order things, said after by, in order of, sorted by.
const ORDER = [
  ['make a timeline of the planets by distance', 'dg30', 'make/', { kind: 'timeline', topic: 'planets', criterion: 'distance' }],
  ['a timeline of the planets by distance from the sun', 'dg31', 'make/', { kind: 'timeline', topic: 'planets', criterion: 'distance from the sun' }],
  ['make a timeline of the planets sorted by size', '', 'make/', { kind: 'timeline', topic: 'planets', criterion: 'size' }],
  ['draw a timeline of the planets in order of distance from the sun', '', 'make/', { kind: 'timeline', topic: 'planets', criterion: 'distance from the sun' }],
  ['make a timeline of the planets sorted by how far they are', '', 'make/', { kind: 'timeline', topic: 'planets', criterion: 'how far' }],
  ['a flowchart of the planets ranked by temperature', '', 'make/', { kind: 'flowchart', topic: 'planets', criterion: 'temperature' }],
  ['make a list of the planets by size', '', 'make/', { kind: 'list of the planets', criterion: 'size' }],
  ['line up the planets in order of size', '', 'place/', { thing: 'planets', criterion: 'size' }],
  ['sort the planets by size', '', 'group/group', { thing: 'planets', criterion: 'size' }],
  ['sort the animals in order of how heavy they are', '', 'group/group', { thing: 'animals', criterion: 'how heavy they are' }],
];
// The kind after the topic (block 07:45 item 2): with on/in only a kind that names no drawing ("draw a bird in a tree"
// is a bird), with as any kind, and any kind after a topic that names the nodes of a fill ("the parts of a car").
const AFTER = [
  ['draw the planets in order of distance from the sun on a timeline', '', 'make/', { kind: 'timeline', topic: 'planets', criterion: 'distance from the sun' }],
  ['put the parts of a car in a tree', '', 'make/', { kind: 'tree', topic: 'parts of a car' }],
  ['draw the planets on a timeline', '', 'make/', { kind: 'timeline', topic: 'planets' }],
  ['draw the parts of a car as a tree', '', 'make/', { kind: 'tree', topic: 'parts of a car' }],
  ['show the steps of making tea in a flowchart', '', 'make/', { kind: 'flowchart', topic: 'steps of making tea' }],
  ['put the planets in order of size on a timeline', '', 'make/', { kind: 'timeline', topic: 'planets', criterion: 'size' }],
  ['turn the stages of the water cycle into a cycle diagram', '', 'make/', { kind: 'cycle diagram', topic: 'stages of the water cycle' }],
  ['arrange the kinds of animals in a venn diagram', '', 'make/', { kind: 'venn diagram', topic: 'kinds of animals' }],
  ['put the seasons in a cycle', '', 'make/', { kind: 'cycle', topic: 'seasons' }],
  ['draw the months of the year on a time line', '', 'make/', { kind: 'time line', topic: 'months of the year' }],
  // not a diagram: a drawing in a tree, things already there laid out as a tree
  ['draw a bird in a tree', '', 'make/', { kind: 'bird', 'place.marker': 'in', place: 'tree' }],
  ['put the boxes in a tree', '', 'place/layout', { thing: 'boxes', direction: 'tree' }],
  ['put the nest of the bird in a tree', '', 'place/layout', { thing: 'nest of the bird', direction: 'tree' }],
];
// Single-letter names (block 07:45 item 3): a capital letter after connect, from, to, between, and, box ... is a name.
const NAMES = [
  ['connect A to C', '', 'connect/', { thing: 'a', target: 'c' }],
  ['Connect A to B.', '', 'connect/', { thing: 'a', target: 'b' }],
  ['connect B to A', '', 'connect/', { thing: 'b', target: 'a' }],
  ['join A and C', '', 'connect/', { thing: 'a', target: 'c' }],
  ['Connect A To C', '', 'connect/', { thing: 'a', target: 'c' }],
  ['connect box A to box C', '', 'connect/', { thing: 'box a', target: 'box c' }],
  ['connect the box A to the box C', '', 'connect/', { thing: 'box a', target: 'box c' }],
  ['label the arrow from A to B no', '', 'change/set', { thing: 'arrow from a to b', value: 'no', attribute: 'label' }],
  ['label the line between A and B yes', '', 'change/set', { thing: 'line between a and b', value: 'yes', attribute: 'label' }],
  // the article stays the article: a lower-case a, a capital A first or after another word
  ['put a cat to the left of a dog', '', 'place/', { thing: 'cat', 'place.marker': 'to the left of', place: 'dog' }],
  ['A tree of the parts of a car', '', 'make/', { kind: 'tree', topic: 'parts of a car' }],
  ['make A timeline of the planets by distance', '', 'make/', { kind: 'timeline', topic: 'planets', criterion: 'distance' }],
];
// Arrangements PSys2 sent to its avatar world (dg02, dg03, dg06, dg08, dg10): w.lang.en's layout frame already reads them
// (acts.place.layout takes the verbs of place); the cause is the host's routing, not a missing frame.
const ARRANGED = [
  ['put the boxes in a circle', 'dg02', 'place/layout', { thing: 'boxes', direction: 'in a circle' }],
  ['put them in a circle', 'dg03', 'place/layout', { thing: 'them', direction: 'in a circle' }],
  ['put them in a grid', 'dg06', 'place/layout', { thing: 'them', direction: 'grid' }],
  ['put the boxes in a row', 'dg08', 'place/layout', { thing: 'boxes', direction: 'row' }],
  ['put the boxes in a column', 'dg10', 'place/layout', { thing: 'boxes', direction: 'column' }],
];

const check = (rows) => {
  const bad = [];
  for (const [s, id, actMode, args] of rows) {
    const [r] = read(s);
    const got = r ? `${r.act}/${r.mode ?? ''} ${JSON.stringify(Object.fromEntries(Object.entries(r.args).sort()))}` : 'nothing';
    const want = `${actMode} ${JSON.stringify(Object.fromEntries(Object.entries(args).sort()))}`;
    if (got !== want) bad.push(`${id || '-'} "${s}": ${got} (${r?.frame}), want ${want}`);
  }
  return bad;
};

test('the shard diagram-frames is what tools/lang-en-diagram-frames.mjs gives (its lexicons follow k.diagrams, w.diagram and the arrangements)', () => {
  assert.equal(readFileSync(join(WORLDS_DIR, 'w.lang.en', 'shards', 'diagram-frames.sop'), 'utf8'), diagramFrameShard(), 'run node tools/lang-en-diagram-frames.mjs (npm run build does)');
});

test('layout direction: "make the arrows go left to right" and its paraphrases read as place/layout with a direction whose diagram layout is a layout of k.diagrams', () => {
  assert.deepEqual(check(LAYOUT), []);
  const kindLayouts = new Set(kinds.flatMap((k) => vals(k, 'layout')));
  for (const [, , , { direction }] of LAYOUT) assert.ok(kindLayouts.has(layoutOf(direction)), `${direction}: ${layoutOf(direction)}`);
  assert.equal(layoutOf('left to right'), 'left_right');
  assert.equal(layoutOf('top to bottom'), 'top_down');
  assert.ok(vals(kinds.find((k) => one(k, 'name') === 'flowchart'), 'layout').includes('left_right'));
});

test('edge labels: "call the arrow yes", "label the arrow from A to B no" read as change/set of the label of the edge', () => {
  assert.deepEqual(check(LABEL), []);
  const edgeKeys = schema('w.diagram').filter((w) => w.type === 'core.slot' && one(w, 'of') === 'w.diagram.edge').map((w) => one(w, 'key'));
  assert.ok(edgeKeys.includes('label'));
  // the thing is an edge: its first word is a word of w.diagram.edge
  const edge = new Set(schema('w.diagram').filter((w) => w.type === 'core.word' && one(w, 'means') === 'w.diagram.edge').flatMap((w) => vals(w, 'text')));
  for (const [, , , { thing }] of LABEL) assert.ok(edge.has(toks(thing)[0]), thing);
  // a name stays a name where the world has one ("Call yourself Robi": the avatar's frame)
  const avatar = frameReader(all, actions, { needs: (n) => [undefined, 'attrs', 'name', 'self'].includes(n) });
  assert.equal(avatar('Call yourself Robi.')[0].frame, 'acts.change.call');
});

test('a diagram of a kind about a topic: the kind is a k.diagrams kind or one of its words, the topic the rest', () => {
  assert.deepEqual(check(KINDS), []);
  for (const [, , , { kind }] of KINDS) assert.ok(kindOf(kind), kind);
  assert.equal(kindOf('hierarchy'), 'tree');
  assert.equal(kindOf('cycle diagram'), 'cycle');
  assert.equal(kindOf('venn diagram'), 'Venn diagram');
  // "make a chart about sales" stays the general topic frame (chart is no kind of diagram here)
  assert.equal(read('Make a chart about sales.')[0].frame, 'acts.make.topic');
});

test('the order criterion: "a timeline of the planets by distance" reads make with the kind, the topic and the criterion; place and group take it too', () => {
  assert.deepEqual(check(ORDER), []);
  // by marks a place, and how far, where no attribute follows
  assert.equal(read('make a picture by the window')[0].args.criterion, undefined);
  assert.equal(read('move it by 2')[0].args.criterion, undefined);
  // the roles are k.actions roles that hold an attribute, marked by prepositions of w.lang.en
  const roles = actions.filter((w) => w.type === 'k.actions.role' && one(w, 'name') === 'criterion');
  assert.deepEqual(roles.map((r) => one(r, 'act')).sort(), ['group', 'make', 'place']);
  for (const r of roles) assert.equal(one(r, 'holds'), 'attribute', one(r, 'act'));
  assert.deepEqual(vals(roles.find((r) => one(r, 'act') === 'make'), 'marker'), ['by', 'in order of', 'according to']);
  assert.ok(!vals(roles.find((r) => one(r, 'act') === 'place'), 'marker').includes('by'), 'by marks how far a thing is moved');
});

test('the criterion joins k.attributes: every word of order.criterion is an attribute that holds a number, a size or a step of a scale, found in a world; by distance the planets are in their order of k.space', () => {
  const attrs = shardsOf('k.attributes').flatMap((t) => parse(t));
  const attribute = new Map(attrs.filter((w) => w.type === 'k.attributes.attribute').map((w) => [one(w, 'name'), w]));
  const found = attrs.filter((w) => w.type === 'k.attributes.found');
  const words = schema('k.attributes').filter((w) => w.type === 'core.word' && one(w, 'of') === 'k.attributes.attribute.name');
  const attributeOf = (c) => (attribute.has(c) ? c : one(words.find((w) => vals(w, 'text').includes(c)) ?? { attrs: {} }, 'means'));
  const L = lex('order.criterion');
  assert.deepEqual(L, lexicons()['order.criterion'].items);
  for (const c of L) {
    const a = attributeOf(c);
    assert.ok(a && attribute.has(a), `${c}: no attribute`);
    assert.ok(['number', 'size', 'class'].includes(one(attribute.get(a), 'holds')), `${c}: ${a} holds ${one(attribute.get(a), 'holds')}`);
    assert.ok(found.some((f) => one(f, 'attribute') === a), `${c}: ${a} is found in no world`);
  }
  for (const [, , , { criterion }] of ORDER) assert.ok(attributeOf(toks(criterion).filter((t) => !['they', 'are'].includes(t)).join(' ')), criterion);
  assert.equal(attributeOf('distance from the sun'), 'distance');
  // distance is found in k.space; the planets (they orbit the Sun) sorted by distance_about are in their `order`
  const f = found.find((x) => one(x, 'attribute') === 'distance' && one(x, 'world') === 'k.space');
  assert.equal(`${one(f, 'type')}.${one(f, 'key')}`, 'k.space.body.distance_about');
  const planets = shardsOf('k.space').flatMap((t) => parse(t)).filter((w) => w.type === 'k.space.body' && one(w, 'kind') === 'planet');
  assert.equal(planets.length, 8);
  for (const p of planets) assert.equal(one(p, 'orbits'), 'Sun', one(p, 'name'));
  const byDistance = [...planets].sort((a, b) => Number(one(a, 'distance_about')) - Number(one(b, 'distance_about')));
  assert.deepEqual(byDistance.map((p) => Number(one(p, 'order'))), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.deepEqual(byDistance.map((p) => one(p, 'name')).slice(0, 4), ['Mercury', 'Venus', 'Earth', 'Mars']);
});

test('the kind after the topic: "draw the planets in order of distance from the sun on a timeline", "put the parts of a car in a tree" read make with kind and topic', () => {
  assert.deepEqual(check(AFTER), []);
  // diagram.kind.only is diagram.kind without the words that name a drawing of k.objects (tree)
  const only = lex('diagram.kind.only');
  assert.deepEqual(lex('diagram.kind').filter((k) => !only.includes(k)), ['tree']);
  assert.ok(shardsOf('k.objects').some((t) => t.includes(' k.objects.object name=tree ')), 'tree is a drawing');
  // every topic head names the facts of a fill of k.diagrams
  const fillTypes = new Set(shardsOf('k.diagrams').flatMap((t) => parse(t)).filter((w) => w.type === 'k.diagrams.fill').map((w) => one(w, 'type')));
  for (const [noun, type] of Object.entries(TOPIC_HEADS)) assert.ok(fillTypes.has(type), `${noun}: ${type} fills no kind`);
  assert.deepEqual(lex('diagram.topic.head'), Object.keys(TOPIC_HEADS).sort());
});

test('single-letter names: "connect A to C" reads A and C as the things, not "a" as the article (reference reader)', () => {
  assert.deepEqual(check(NAMES), []);
  // without the lexicon name.letter.after a reader reads as before ("A" is the article, the thing "to c")
  const plain = frameReader(all.filter((w) => !(w.type === 'w.lang.en.lex' && one(w, 'name') === 'name.letter.after')), actions, { needs: (n) => NEEDS.has(n) });
  assert.deepEqual(plain('connect A to C')[0].args, { thing: 'to c' });
  // the words of the lexicon: the verbs of connect asked for, the ends of an edge, w.diagram's words for a node and an edge
  for (const w of ['connect', 'from', 'to', 'between', 'and', 'box', 'node', 'arrow']) assert.ok(lex('name.letter.after').includes(w), w);
});

test('the arrangements PSys2 sent to another world are read as place/layout by the existing layout frame', () => {
  assert.deepEqual(check(ARRANGED), []);
});

test('the lexicons join their homes: every kind reached, every edge word a w.diagram edge word, every direction an arrangement phrase', () => {
  const L = lexicons();
  for (const w of lex('diagram.kind')) assert.ok(kindOf(w), w);
  for (const k of kinds) assert.ok(lex('diagram.kind').includes(one(k, 'name').toLowerCase()), one(k, 'name'));
  assert.ok(kindWords.length >= kinds.length, 'a word for every kind');
  for (const k of kinds) assert.ok(kindWords.some((w) => one(w, 'means') === one(k, 'name')), `no word for ${one(k, 'name')}`);
  assert.deepEqual(lex('diagram.edge'), L['diagram.edge'].items);
  for (const d of lex('diagram.direction')) assert.ok(['left_right', 'top_down'].includes(layoutOf(d)), d);
  for (const d of ['left to right', 'from left to right', 'top to bottom', 'from top to bottom']) assert.ok(lex('diagram.direction').includes(d), d);
});
